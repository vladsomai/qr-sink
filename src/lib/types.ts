interface Product {
    Product: string;
    Version: string;
    SerialNumber: string;
    Key: string;
}

interface ProductRequest {
    Product: Product | null,
    ProductVersion: ProductVersion
    HtmlPage: string
}

interface Firmware {
    "version": string
    "compatibility": number,
    "date": string,
    "description": string,
    "url": string,
    "sha256": string
}

interface ProductVersion {
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