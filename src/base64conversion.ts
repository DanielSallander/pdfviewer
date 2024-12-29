export class base64conversion {
    public convertDataURIToBinary (dataURI: string) {

        const BASE64_MARKER = ';base64,';
        const base64Index = dataURI.indexOf(BASE64_MARKER);
        
        // Extract the base64 data, whether it's a complete URI or just the base64 string
        const base64 = base64Index >= 0 
            ? dataURI.substring(base64Index + BASE64_MARKER.length)
            : dataURI;
        
        // Use atob for browser compatibility
        const raw = atob(base64);
        const rawLength = raw.length;
        const array = new Uint8Array(new ArrayBuffer(rawLength));

        for(let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        
        return array;
    }

    public isBase64(str: string): boolean {
        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
        return base64Regex.test(str);
    }
}