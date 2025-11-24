
export interface User {
    username: string;
    scryptHash: string;
}

export interface EvidenceRecord {
    id: number;
    created_at: string;
    agent_id: string;
    case_title: string;
    classification_level: 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
    encrypted_description: string; // SuperEncrypted
    encrypted_file_b64: string | null; // RailFence bytes -> Base64
    file_name: string | null;
    file_rail_key_hint: string | null;
    stego_image_b64: string | null; // DataURL
}
