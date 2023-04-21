export interface Product {
    Product: string;
    Version: string;
    SerialNumber: string;
    Key: string;
}

export interface ProductRequest {
    Product: Product | null,
    ProductVersion: ProductVersion
    HtmlPage: string
}

export interface Firmware {
    "version": string
    "compatibility": number,
    "date": string,
    "description": string,
    "url": string,
    "sha256": string
}

export interface ProductVersion {
    version: string,
    type: string,
    web_page_template: string,
    picture: string,
    description: string,
    schamatic: string,
    user_manual: string,
    tutorial: string,
    github: string,
    firmwares: Firmware[]
}


export const downloadIcon = `		<svg
xmlns="http://www.w3.org/2000/svg"
width="16"
height="16"
fill="currentColor"
class="bi bi-download"
viewBox="0 0 16 16"
>
<path
    d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"
/>
<path
    d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"
/>
</svg>`