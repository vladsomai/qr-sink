export const prerender = false
export const ssr = false
export const csr = true

import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { ProductVersion, ProductRequest, Product } from '$lib/types';
import { parse } from 'yaml'

const productDataYAMLFile = 'PRODUCT_DATA.yaml'
const productDataJSONFile = 'PRODUCT_DATA.json'

function parseQueryString(inputStr: string): Product | null {
    const ProductArr = inputStr.split('_');
    if (ProductArr.length == 2 || ProductArr.length == 4) {
        return {
            Product: ProductArr[0].toUpperCase(),
            Version: ProductArr[1].toUpperCase(),
        };
    }
    return null;
}

/*
This method loops over all public repositories and returns a valid JSON object containing all available products
*/
async function getAllAvailableProducts(allRepos: any[], fetch: Function): Promise<any[]> {

    const githubRawHost = 'https://raw.githubusercontent.com/'
    const productDataPath = '/main/' + productDataYAMLFile

    let products: any[] = []

    const promises = allRepos.map(async (repo: any) => {
        try {
            const filePath = githubRawHost + repo.full_name + productDataPath
            const reqProductDataJson = await fetch(filePath)
            const productDataYAMLText = await reqProductDataJson.text();
            const productDataJson = parse(productDataYAMLText)
            products = [...products, ...productDataJson]
            console.log("Success reading YAML from ", repo.full_name)

        } catch (error) {
            try {
                //try convert to json if yaml does not work
                const filePath = githubRawHost + repo.full_name + '/main/' + productDataJSONFile
                const reqProductDataJson = await fetch(filePath)
                const productDataJson = await reqProductDataJson.json();
                products = [...products, ...productDataJson]
                console.log("Success reading JSON from ", repo.full_name)
            }
            catch (err) {
                //we will only catch the error
            }
        }
    })

    await Promise.all(promises)

    return products
}

/*
This method will make async fetch requests to read multiple users repos
*/
async function readAllRepositories(githubUsers: string[], fetch: Function): Promise<any[]> {

    let repos: any[] = [] //a list of all available repositories

    const promises = githubUsers.map(async (githubUserRepos: any) => {
        try {
            const reqAllUserRepos = await fetch(githubUserRepos)
                .catch((err: any) => {
                    console.log("Fetch rejected", err)
                })
            const _allRepos = await reqAllUserRepos.json();
            repos = [...repos, ..._allRepos]
        } catch (err) {
            console.log("Could not read all repositories.", err)

        }
    })

    await Promise.all(promises)

    return repos
}

export const load = (async ({ fetch, params }) => {
    const product = parseQueryString(params.root);
    if (product == null) {
        throw error(404, 'Product does not have a valid query string');
    }

    const githubUserRepos = ['https://api.github.com/users/tomrodinger/repos']

    const repos = await readAllRepositories(githubUserRepos, fetch)
    const productDataJson = await getAllAvailableProducts(repos, fetch)

    let found = false
    let productVersion: ProductVersion = {
        version: "",
        type: "",
        web_page_template: "",
        picture: [],
        video: "#",
        description: "",
        schematic: "",
        user_manual: "",
        tutorial: "",
        github: "",
        firmwares: []
    }

    const foundProducts:string[] = []
    productDataJson.map((item: any) => {
        const productCode = item.product.toString();
        item.versions.map((versionItem: ProductVersion)=>{
            foundProducts.push(`${productCode}_${versionItem.version.toString()}`)
        })

        if (item.product.toString().toUpperCase() == product?.Product.toString().toUpperCase()) {
            item.versions.map((versionItem: ProductVersion) => {
                if (versionItem.version.toString().toUpperCase() == product.Version.toString().toUpperCase()) {
                    found = true
                    productVersion = versionItem
                    if (versionItem.firmwares) {
                        versionItem.firmwares.sort(
                            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                        )
                        if (versionItem.firmwares.length != 0) {
                            versionItem.firmwares[0].date += " (latest)"
                        }
                    }
                }
            })
        }
    })


    if (!found) {
        console.log(`Product ${product.Product}_${product.Version} was not found. Available products: ${foundProducts}`)

        throw error(404, 'Product not found');
    }

    const reqHtmlPage = await fetch(productVersion.web_page_template);
    // const reqHtmlPage = await fetch('http://localhost:5173/default_template.html');
    const htmlPage = await reqHtmlPage.text()

    const reply: ProductRequest = { Product: product, ProductVersion: productVersion, HtmlPage: htmlPage }

    return reply

}) satisfies PageLoad;