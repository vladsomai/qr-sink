import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ProductVersion, ProductRequest, Product } from '$lib/types';

function parseQueryString(inputStr: string): Product | null {
    const ProductArr = inputStr.split('_');
    if (ProductArr.length == 4) {
        return {
            Product: ProductArr[0],
            Version: ProductArr[1],
            SerialNumber: ProductArr[2],
            Key: ProductArr[3]
        };
    }
    return null;
}

export const load = (async ({ params }) => {
    const product = parseQueryString(params.page);

    if (product == null) {
        throw error(404, 'Product does not have a valid query string');
    }

    const reqProductDataJson = await fetch('https://raw.githubusercontent.com/vladsomai/test_line_following_robot/main//PRODUCT_DATA.json')
    const productDataJson = await reqProductDataJson.json();

    let found = false
    let productVersion: ProductVersion = {
        version: "",
        type: "",
        web_page_template: "",
        picture: "",
        description: "",
        schamatic: "",
        user_manual: "",
        tutorial: "",
        github: "",
        firmwares: []
    }

    productDataJson.map((item: any) => {
        if (item.product == product?.Product) {
            item.versions.map((versionItem: ProductVersion) => {
                if (versionItem.version == product.Version) {
                    found = true
                    productVersion = versionItem
                }
            })
        }
    })

    if (!found) {
        throw error(404, 'Product not found');
    }
    const reqHtmlPage = await fetch(productVersion.web_page_template);
    // const reqHtmlPage = await fetch('http://localhost:5173/default_template.html');
    const htmlPage = await reqHtmlPage.text()

    const reply: ProductRequest = { Product: product, ProductVersion: productVersion, HtmlPage: htmlPage }

    return reply

}) satisfies PageServerLoad;