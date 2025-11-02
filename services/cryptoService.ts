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
 * MOCK Serpent: Simulates the Serpent block cipher using a key.
 * This is a simple XOR cipher for demonstration. Real Serpent is far more complex.
 * @param text The text to encrypt/decrypt.
 * @param key The secret key.
 * @returns The transformed text.
 */
export const serpentMock = (text: string, key: string): string => {
    if (!key) return text;
    let output = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        output += String.fromCharCode(charCode);
    }
    return output;
};

/**
 * Super Encryption: Combines Atbash and mock Serpent ciphers.
 * @param text The plaintext.
 * @param key The Serpent key.
 * @returns The ciphertext.
 */
export const superEncrypt = (text: string, key: string): string => {
    const atbashResult = atbashCipher(text);
    return serpentMock(atbashResult, key);
};

/**
 * Super Decryption: Reverses the super encryption process.
 * @param ciphertext The ciphertext.
 * @param key The Serpent key.
 * @returns The plaintext.
 */
export const superDecrypt = (ciphertext: string, key: string): string => {
    const serpentResult = serpentMock(ciphertext, key);
    return atbashCipher(serpentResult);
};

/**
 * MOCK ElGamal Encryption: Simulates ElGamal file encryption on binary data.
 * It applies a simple byte shift.
 * @param fileBytes The content of the file as a Uint8Array.
 * @returns The "encrypted" file content as a Uint8Array.
 */
export const elgamalMockEncrypt = (fileBytes: Uint8Array): Uint8Array => {
    const encryptedBytes = new Uint8Array(fileBytes.length);
    for (let i = 0; i < fileBytes.length; i++) {
        // Simple byte shift, wrapping around at 256
        encryptedBytes[i] = (fileBytes[i] + 5) % 256;
    }
    return encryptedBytes;
};

/**
 * MOCK ElGamal Decryption: Simulates ElGamal file decryption on binary data.
 * @param encryptedBytes The encrypted file content as a Uint8Array.
 * @returns The original file content as a Uint8Array.
 */
export const elgamalMockDecrypt = (encryptedBytes: Uint8Array): Uint8Array => {
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
        // Reverse the byte shift, wrapping around correctly for negative numbers
        decryptedBytes[i] = (encryptedBytes[i] - 5 + 256) % 256;
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