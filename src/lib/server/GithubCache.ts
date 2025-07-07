import { CacheType, ProductRequest, ProductType, RepoType, VersionType } from '$lib/types'
import { parse } from 'yaml'

const CACHE_EXPIRES_SEC = 600

let lastRequestTimestampReposSec = new Date().getTime() / 1000 - CACHE_EXPIRES_SEC
let lastRequestTimestampProductsSec = new Date().getTime() / 1000 - CACHE_EXPIRES_SEC


function didCacheExpire(cacheType: CacheType): boolean {

    const currentTimestampSec = new Date().getTime() / 1000;

    let lastRequestTimestampSec = 0
    if (cacheType == CacheType.Products) {
        lastRequestTimestampSec = lastRequestTimestampProductsSec
    }
    else if (cacheType == CacheType.Repos) {
        lastRequestTimestampSec = lastRequestTimestampReposSec
    }

    const elapsedSeconds = currentTimestampSec - lastRequestTimestampSec

    let result = false
    if (elapsedSeconds >= 600) {
        result = true

        if (cacheType == CacheType.Products) {
            lastRequestTimestampProductsSec = currentTimestampSec
        }
        else if (cacheType == CacheType.Repos) {
            lastRequestTimestampReposSec = currentTimestampSec
        }

    }

    return result

}
export class GithubCacheRepos {
    static GithubReposObj: RepoType[] = [];
    static GithubProductsObj: ProductType[] = [];

    static GetAllRepos(GithubUsersApiEndpoints: string[]): Promise<RepoType[]> {
        return new Promise<RepoType[]>(async (resolve) => {

            if (!didCacheExpire(CacheType.Repos)) {
                console.log("Cache hit for repos")
                resolve(GithubCacheRepos.GithubReposObj)
                return
            }

            const allReposPromises: Promise<RepoType[]>[] = GithubUsersApiEndpoints.map(async (apiEndpoint) => {

                try {
                    let anErrorOcurred = false
                    console.log("Fetching from endpoint:", apiEndpoint)
                    const reqAllUserRepos = await fetch(apiEndpoint)
                        .catch((err: any) => {
                            anErrorOcurred = true
                            console.log("Fetch rejected", err)
                        })

                    if (reqAllUserRepos == null ||
                        anErrorOcurred) {
                        return []
                    }

                    const _reposApiResponse = await reqAllUserRepos.json();

                    const reposForCurEndpoint: RepoType[] = []

                    for (let repo of _reposApiResponse) {
                        const result: RepoType = {
                            full_name: repo.full_name
                        }
                        reposForCurEndpoint.push(result)
                    }

                    return reposForCurEndpoint

                } catch (err) {
                    console.log(`Could not read repo for endpoint: ${apiEndpoint}`, err)
                    return []
                }
            })


            const reposArrayCombined: (RepoType[])[] = await Promise.all(allReposPromises).catch((reason) => {
                console.log("Promise all rejected: ", reason)
                return []
            })

            for (let repoArray of reposArrayCombined) {
                GithubCacheRepos.GithubReposObj = [...GithubCacheRepos.GithubReposObj, ...repoArray]
            }

            resolve(GithubCacheRepos.GithubReposObj)
        })

    }

    static GetAllAvailableProducts(RepositoryList: RepoType[]): Promise<ProductType[]> {
        const productDataYAMLFile = 'PRODUCT_DATA.yaml'
        const productDataJSONFile = 'PRODUCT_DATA.json'

        return new Promise<ProductType[]>(async (resolve) => {

            if (!didCacheExpire(CacheType.Products)) {
                console.log("Cache hit for products")
                resolve(GithubCacheRepos.GithubProductsObj)
                return
            }

            const githubRawHost = 'https://raw.githubusercontent.com/'
            const productDataPath = '/main/' + productDataYAMLFile

            const promises: Promise<ProductType[]>[] = RepositoryList.map(async (repo: RepoType) => {
                let repoProducts: ProductType[] = []

                try {
                    const yamlFilePath = githubRawHost + repo.full_name + productDataPath
                    console.log("Fetching yaml:", yamlFilePath)
                    const yamlProductReq = await fetch(yamlFilePath).catch((reason) => {
                        console.log(`Fetching yaml file from repo ${repo.full_name} failed. Reason:`, reason)
                        return null
                    })

                    if (yamlProductReq == null) {
                        throw ".yaml file could not be fetched"
                    }

                    const productDataYAMLText = await yamlProductReq.text();
                    const curProducts: ProductType[] = parse(productDataYAMLText) as ProductType[]
                    repoProducts = [...repoProducts, ...curProducts]
                    console.log("Success reading YAML from ", repo.full_name)
                } catch (error) {
                    try {
                        //try convert to json if yaml does not work
                        const filePath = githubRawHost + repo.full_name + '/main/' + productDataJSONFile
                        console.log("Fetching json:", filePath)
                        const jsonProducReq = await fetch(filePath).catch((reason) => {
                            console.log(`Fetching .json file from repo ${repo.full_name} failed. Reason:`, reason)
                            return null
                        })

                        if (jsonProducReq == null) {
                            throw ".json file could not be fetched"
                        }

                        const curProducts: ProductType[] = await jsonProducReq.json() as ProductType[];
                        repoProducts = [...repoProducts, ...curProducts]
                        console.log("Success reading JSON from ", repo.full_name)
                    }
                    catch (err) {
                        //swallow the error
                    }
                }

                return repoProducts
            })

            const allProductsArray: ProductType[][] = await Promise.all(promises).catch((reason) => {
                console.log(`GetAllAvailableProducts: Promise.all rejected. Reason: `, reason)
                return []
            })

            GithubCacheRepos.GithubProductsObj = []
            for (let productsArr of allProductsArray) {
                GithubCacheRepos.GithubProductsObj = [...GithubCacheRepos.GithubProductsObj, ...productsArr]
            }

            resolve(GithubCacheRepos.GithubProductsObj)
        })
    }

    static FindRequestedProduct(productCode: string, productVersion: string, productList: ProductType[]): Promise<ProductRequest | null> {
        const toSearchFor = `${productCode.toString().toUpperCase()}_${productVersion.toString().toUpperCase()}`

        return new Promise<ProductRequest | null>(async (resolve) => {

            const foundProducts: Map<string, VersionType> = new Map()

            productList.map((product: ProductType) => {
                const productCode = product.product.toString().toUpperCase();

                product.versions.map((versionItem) => {
                    const versionCode = versionItem.version.toString().toUpperCase();
                    foundProducts.set(`${productCode}_${versionCode}`, versionItem)
                })
            })

            if (foundProducts.has(toSearchFor)) {
                const versionItem = foundProducts.get(toSearchFor) as VersionType
                const productReq: ProductRequest = {
                    Product: productCode,
                    Version: versionItem,
                    HtmlPage: ""
                }
                resolve(productReq)
                return
            }

            console.log(`Could not find ${toSearchFor}. Available products: ${[...foundProducts.keys()]}`)
            resolve(null)
        })
    }
}

