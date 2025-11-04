// --- IMPORTANT ---
// These functions are for educational and demonstration purposes only.
// They are NOT cryptographically secure and should NOT be used in production.

/**
 * MOCK Scrypt: Simulates a Scrypt key derivation function.
 * In a real app, use a library like 'scrypt-js'.
 * @param password The user's password.
 * @param salt A random salt.
 * @returns A deterministic "hash" of the password and salt.
 */
export const scryptMock = async (password: string, salt: string): Promise<string> => {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Atbash Cipher: A simple substitution cipher where letters are reversed.
 * @param text The text to encrypt/decrypt.
 * @returns The transformed text.
 */
export const atbashCipher = (text: string): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const reversed = 'ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba';
    return text.split('').map(char => {
        const index = alphabet.indexOf(char);
        return index !== -1 ? reversed[index] : char;
    }).join('');
};

/**
 * MOCK Serpent Encryption: Simulates the Serpent block cipher using a key.
 * This is a simple XOR cipher for demonstration. Real Serpent is far more complex.
 * @param text The text to encrypt.
 * @param key The secret key.
 * @returns The encrypted text as a hex string.
 */
export const serpentMockEncrypt = (text: string, key: string): string => {
    if (!key) return text;
    let hexOutput = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        hexOutput += charCode.toString(16).padStart(4, '0');
    }
    return hexOutput;
};

/**
 * MOCK Serpent Decryption: Reverses the mock Serpent encryption from a hex string.
 * @param hexInput The encrypted hex string.
 * @param key The secret key.
 * @returns The decrypted text.
 */
export const serpentMockDecrypt = (hexInput: string, key: string): string => {
    if (!key) return hexInput;
    // Return early if not a valid hex string (e.g. attempting to decrypt unencrypted data)
    if (/[^0-9a-fA-F]/.test(hexInput) || hexInput.length % 4 !== 0) {
        return hexInput;
    }
    let textOutput = '';
    for (let i = 0; i < hexInput.length; i += 4) {
        const hex = hexInput.substring(i, i + 4);
        const charCode = parseInt(hex, 16);
        const originalCharCode = charCode ^ key.charCodeAt((i / 4) % key.length);
        textOutput += String.fromCharCode(originalCharCode);
    }
    return textOutput;
};


/**
 * Super Encryption: Combines Atbash and mock Serpent ciphers.
 * @param text The plaintext.
 * @param key The Serpent key.
 * @returns The ciphertext (hex string from Serpent).
 */
export const superEncrypt = (text: string, key: string): string => {
    const atbashResult = atbashCipher(text);
    return serpentMockEncrypt(atbashResult, key);
};

/**
 * Super Decryption: Reverses the super encryption process.
 * @param ciphertext The hex ciphertext.
 * @param key The Serpent key.
 * @returns The plaintext.
 */
export const superDecrypt = (ciphertext: string, key: string): string => {
    const serpentResult = serpentMockDecrypt(ciphertext, key);
    return atbashCipher(serpentResult);
};

/**
 * MOCK ElGamal Encryption: Simulates ElGamal file encryption on binary data using a key.
 * It applies a simple XOR cipher.
 * @param fileBytes The content of the file as a Uint8Array.
 * @param key The secret key.
 * @returns The "encrypted" file content as a Uint8Array.
 */
export const elgamalMockEncrypt = (fileBytes: Uint8Array, key: string): Uint8Array => {
    if (!key) return fileBytes;
    const encryptedBytes = new Uint8Array(fileBytes.length);
    for (let i = 0; i < fileBytes.length; i++) {
        encryptedBytes[i] = fileBytes[i] ^ key.charCodeAt(i % key.length);
    }
    return encryptedBytes;
};

/**
 * MOCK ElGamal Decryption: Simulates ElGamal file decryption on binary data using a key.
 * @param encryptedBytes The encrypted file content as a Uint8Array.
 * @param key The secret key.
 * @returns The original file content as a Uint8Array.
 */
export const elgamalMockDecrypt = (encryptedBytes: Uint8Array, key: string): Uint8Array => {
    if (!key) return encryptedBytes;
    // XOR is symmetric, so decryption is the same operation as encryption
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
        decryptedBytes[i] = encryptedBytes[i] ^ key.charCodeAt(i % key.length);
    }
    return decryptedBytes;
};


// --- Steganography (DCT Simulation using LSB) ---

// Converts a message string to a binary string.
const messageToBinary = (message: string): string => {
    return message.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('') + '1111111111111110'; // Delimiter
};

// Hides a binary message in the image data.
const hideMessage = (imageData: ImageData, binaryMessage: string) => {
    const data = imageData.data;
    for (let i = 0; i < binaryMessage.length; i++) {
        if ((i + 1) * 4 > data.length) {
            throw new Error("Message is too long for this image.");
        }
        const pixelIndex = i * 4;
        // Modify the LSB of the blue channel
        data[pixelIndex + 2] = (data[pixelIndex + 2] & 0xFE) | parseInt(binaryMessage[i], 2);
    }
    return imageData;
};

// Reveals a binary message from the image data.
const revealMessage = (imageData: ImageData): string => {
    const data = imageData.data;
    let binaryMessage = '';
    for (let i = 0; i < data.length; i += 4) {
        const lsb = data[i + 2] & 1;
        binaryMessage += lsb;
    }

    const delimiterIndex = binaryMessage.indexOf('1111111111111110');
    if (delimiterIndex === -1) {
        return "No hidden message found.";
    }

    const extractedBinary = binaryMessage.substring(0, delimiterIndex);
    let message = '';
    for (let i = 0; i < extractedBinary.length; i += 8) {
        const byte = extractedBinary.substring(i, i + 8);
        if (byte.length === 8) {
            message += String.fromCharCode(parseInt(byte, 2));
        }
    }
    return message;
};

/**
 * MOCK DCT Steganography Hide: Simulates hiding a message in an image using LSB.
 * @param imageUrl The data URL of the cover image.
 * @param message The secret message to hide.
 * @returns A promise that resolves with the data URL of the stego-image.
 */
export const dctSteganographyHide = (imageUrl: string, message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context.'));

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const binaryMessage = messageToBinary(message);

            try {
                const newImageData = hideMessage(imageData, binaryMessage);
                ctx.putImageData(newImageData, 0, 0);
                resolve(canvas.toDataURL());
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = imageUrl;
    });
};

/**
 * MOCK DCT Steganography Reveal: Simulates revealing a message from an image using LSB.
 * @param imageUrl The data URL of the stego-image.
 * @returns A promise that resolves with the hidden message.
 */
export const dctSteganographyReveal = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context.'));

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            try {
                const message = revealMessage(imageData);
                resolve(message);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = imageUrl;
    });
};