export const prerender = false
export const ssr = false
export const csr = true

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Product } from '$lib/types';
import { GithubCacheRepos } from '$lib/server/GithubCache';

const githubUserRepos = ['https://api.github.com/users/tomrodinger/repos']

export const load = (async ({ params }) => {
    const product = parseQueryString(params.root);
    if (product == null) {
        throw error(404, 'Product does not have a valid query string');
    }

    console.log(product)
    const repos = await GithubCacheRepos.GetAllRepos(githubUserRepos)
    const availableProducts = await GithubCacheRepos.GetAllAvailableProducts(repos)
    const productRequest = await GithubCacheRepos.FindRequestedProduct(product.ProductCode, product.VersionCode, availableProducts)

    if (productRequest == null) {
        throw error(404, 'Product not found');
    }

    const reqHtmlPage = await fetch(productRequest.Version.web_page_template);
    // const reqHtmlPage = await fetch('http://localhost:5173/default_template.html');
    const htmlPage = await reqHtmlPage.text()
    productRequest.HtmlPage = htmlPage;

    return productRequest

}) satisfies PageServerLoad;

function parseQueryString(inputStr: string): Product | null {
    const ProductArr = inputStr.split('_');
    if (ProductArr.length == 2 || ProductArr.length == 4) {
        return {
            ProductCode: ProductArr[0].toUpperCase(),
            VersionCode: ProductArr[1].toUpperCase(),
        };
    }
    return null;
}