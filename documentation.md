# CipherCom: Secure Comms - Documentation

## 1. Overview

CipherCom is a web application that implements various client-side cryptographic and data concealment techniques. It provides a platform for secure communications, featuring user authentication, encrypted messaging, file obfuscation, and steganography.

The project serves as a functional showcase of these security methods within a React application.

## 🚨 Security Warning

**This application is for demonstration and educational purposes ONLY.** The cryptographic algorithms implemented are classical and are not considered secure by modern standards. **DO NOT use this code or these techniques to protect sensitive real-world data.**

---

## 2. Features

The application is divided into two main parts: an access portal and the main terminal with several modules.

### 2.1. Secure Access (Login)

Users can authenticate using one of two methods:

*   **Web3 Access (Wallet):** Leverages a Web3 wallet like MetaMask to authenticate. The user signs a unique message, and their identity is verified using their wallet address without exposing private keys. This demonstrates passwordless, decentralized identity verification.
*   **Password Access:** A traditional username and password system.
    *   **Registration:** A new user's password is combined with a static salt and hashed using the **SHA-384** algorithm. The resulting hash is stored in a Supabase database.
    *   **Login:** The user provides their credentials. The password is re-hashed locally using SHA-384 and compared against the stored hash to grant access.

### 2.2. CipherCom Terminal (Main App)

Once authenticated, the user enters the main terminal, which is a tabbed interface providing access to the following modules:

*   **Dead Drop (Data Vault):**
    *   Allows users to store encrypted text messages in a shared database, associated with their user profile.
    *   Messages are encrypted client-side with a user-provided key using the **Vigenère cipher** before being sent to the database. The key is never stored.
    *   Users can decrypt their stored messages by providing the correct key.
    *   Features a "Burn Message" option to permanently delete a message from the database.

*   **Encrypted Channel (Text Encryption):**
    *   A tool for point-to-point message encryption.
    *   Uses a "Super Encryption" technique that combines two ciphers: the **Atbash cipher** (a simple substitution cipher) followed by the **Vigenère cipher**.
    *   Users can encrypt and decrypt text and easily swap the input/output for quick conversation flow.

*   **File Obfuscation (File Encryption):**
    *   Encrypts and decrypts entire files using a byte-wise implementation of the **Rail Fence cipher**.
    *   This is a classic transposition cipher that writes data in a zig-zag pattern across a number of "rails" (defined by the numeric key).
    *   The file is processed as a byte array, allowing it to work on any file type. The encrypted file is downloaded with a `.rfc` extension.

*   **Steganography Protocol (Image Steganography):**
    *   Hides data within an image file using the **Least Significant Bit (LSB)** technique.
    *   **Embed:** A secret text message is converted to binary and hidden within the pixel data of a "cover" image. The algorithm modifies the last bit of the **green and blue color channels** of each pixel to store the message bits.
    *   **Extract:** The algorithm reads the LSBs from the green and blue channels of a "stego" image to reveal the hidden message.

---

## 3. Technology Stack

*   **Frontend Framework:** React 19 (using `react` and `react-dom`)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Backend-as-a-Service (BaaS):** Supabase (for user accounts and data vault storage)
*   **Web3 Integration:** Ethers.js (for wallet interaction)
*   **Bundling/Modules:** ES Modules with `importmap` (no local build step required)

---

## 4. Project Setup & Configuration

This project is designed to run directly in a browser that supports ES Modules and `importmap`. The only external dependency that requires setup is Supabase.

### 4.1. Supabase Setup

To enable the "Password Access" and "Dead Drop" features, you must configure a Supabase project.

1.  **Create a Supabase Project:**
    *   Go to [supabase.com](https://supabase.com) and create a free project.
    *   Navigate to your project's **Settings > API**.

2.  **Update Client Configuration:**
    *   Open the file `services/supabaseClient.ts`.
    *   Replace the placeholder values for `supabaseUrl` and `supabaseKey` with your project's **Project URL** and **anon public key**.

3.  **Create Database Tables:**
    *   Go to the **Table Editor** in your Supabase dashboard.
    *   Create two tables with the following schemas:

    **Table 1: `users`**
    (Used for storing Password Access credentials)

    | Column           | Type      | Constraints                             |
    | ---------------- | --------- | --------------------------------------- |
    | `username`       | `text`    | Primary Key, Not Null                   |
    | `created_at`     | `timestamptz` | Not Null, Default: `now()`            |
    | `encrypted_hash` | `text`    | Not Null                                |

    **Table 2: `vault_items`**
    (Used for the Dead Drop feature)

    | Column            | Type      | Constraints                             |
    | ----------------- | --------- | --------------------------------------- |
    | `id`              | `bigint`  | Primary Key, Identity                   |
    | `created_at`      | `timestamptz` | Not Null, Default: `now()`            |
    | `username`        | `text`    | Not Null, Foreign Key to `users.username` |
    | `title`           | `text`    | Not Null                                |
    | `data_type`       | `text`    | Not Null (e.g., 'text')                 |
    | `encrypted_content` | `text`    | Not Null                                |

    *Note: Ensure Row Level Security (RLS) is disabled for these tables for this demo. In a production app, you would configure RLS policies to restrict access.*

---

## 5. Code Structure

*   `/index.html`: The main entry point of the application. It includes the `importmap` for dependencies and loads the root React component.
*   `/index.tsx`: Mounts the main `App` component to the DOM.
*   `/App.tsx`: The root component that manages authentication state and switches between the `LoginPage` and `MainApp`.
*   `/components/`: Contains all the reusable React components.
    *   `LoginPage.tsx`: Handles both Web3 and password-based login/registration logic.
    *   `MainApp.tsx`: The main application shell after login, including the tab navigation.
    *   `DataVault.tsx`, `TextEncryption.tsx`, `FileEncryption.tsx`, `ImageSteganography.tsx`: The individual feature modules.
    *   `Card.tsx`, `Button.tsx`, `Input.tsx`: Basic UI components for a consistent look and feel.
*   `/services/`: Contains logic decoupled from the UI.
    *   `cryptoService.ts`: Contains all the cryptographic and steganographic function implementations.
    *   `supabaseClient.ts`: Initializes and exports the Supabase client instance.
*   `/types.ts`: Defines shared TypeScript types and interfaces.
