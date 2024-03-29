const Cryptox = (function () {
    function encrypt(sourceData: any, secretKey?: string): string {
        if (!sourceData) return "";
        let jsonStr = JSON.stringify(sourceData)
        jsonStr = (jsonStr + "").trim()
        if (!jsonStr) return ""
        secretKey = (secretKey || "").trim();
        secretKey = secretKey || genSecretKey()
        const unicodeArray: number[] = []
        const base64Array: string[] = jsonStr.split('')
        const m = base64Array.length
        const secretArray = secretKey.split('')
        const n = secretArray.length
        for (let i = 0; i < m; i++) {
            const unicodeValue = encodeUnicode(base64Array[i])[0];
            const iv = encodeUnicode(secretArray[i % n])[0];
            unicodeArray.push(unicodeValue + iv)
        }
        const unicodeStr = unicodeArray.toString()
        const encryptData = encodeBase64(unicodeStr)
        return shuffleString(encryptData)
    }

    function decrypt(encryptString: string, validJSON?: boolean, secretKey?: string): string {
        if (!encryptString) return "";
        encryptString = (encryptString + "").trim();
        if (!encryptString) return "";
        const base64String = unshuffleString(encryptString)
        const unicodeStr = decodeBase64(base64String);
        const unicodeArray = unicodeStr.split(',').map(Number);
        const m = unicodeArray.length
        secretKey = (secretKey || "").trim();
        const hasScretKey = secretKey && secretKey.length > 0
        secretKey = secretKey || genSecretKey();
        const base64Arr: string[] = []
        const secretArray = secretKey.split('')
        const n = secretArray.length
        for (let i = 0; i < m; i++) {
            const unicodeValue = unicodeArray[i];
            const iv = encodeUnicode(secretArray[i % n])[0];
            base64Arr[i] = decodeUnicode(unicodeValue - iv);
        }
        const decryptData = base64Arr.join("")
        if (validJSON) {
            if (isJSON(decryptData) || hasScretKey) {
                return decryptData
            }
            secretKey = genSecretKey(undefined, true)
            return decrypt(encryptString, false, secretKey)
        }
        return decryptData
    }

    function decodeBase64(base64Str: string): string {
        const binaryStr = atob(base64Str);
        const decoder = new TextDecoder("utf-8");
        const utf8Str = decoder.decode(new Uint8Array([...binaryStr].map(char => char.charCodeAt(0))));
        return utf8Str;
    }

    function encodeBase64(str: string): string {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const base64Chars = btoa(String.fromCharCode.apply(null, data));
        return base64Chars;
    }

    function decodeUnicode(...codes: number[]): string {
        return String.fromCharCode(...codes);
    }

    function encodeUnicode(str: string): number[] {
        return str.split('').map(char => char.charCodeAt(0));
    }

    function genSecretKey(date?: Date, previousMinute?: boolean): string {
        if (!date) {
            date = new Date();
        }
        if (previousMinute === true) {
            date = getPreviousMinuteDate(date)
        }
        const timestampInSeconds = Math.floor(date.getTime() / 1000);
        const timestampInMinutes = timestampInSeconds - (timestampInSeconds % 60);
        const s = (timestampInMinutes * date.getMinutes() / 10).toString();
        return s.split('').reverse().join('') + s;
    }

    function isJSON(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    function getPreviousMinuteDate(date?: Date): Date {
        const now = date || new Date();
        now.setMinutes(now.getMinutes() - 1);
        return now;
    }

    function shuffleString(text: string): string {
        const characters = text.split('');
        let left = 0;
        let right = characters.length - 1;
        while (left < right) {
            [characters[left], characters[right]] = [characters[right], characters[left]];
            left++;
            right--;
        }
        return characters.join('');
    }

    function unshuffleString(shuffledText: string): string {
        return shuffleString(shuffledText);
    }

    return {
        encrypt: encrypt,
        decrypt: decrypt,
    }
})();
