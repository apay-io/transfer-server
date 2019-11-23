export enum StatusEnum {
    live = "live",
    test = "test",
    dead = "dead",
    'private' = "private"
}

export enum AnchorAssetTypeEnum {
    crypto = "crypto",
    fiat = "fiat",
    stock = "stock",
    bond = "bond",
    commodity = "commodity",
    realestate = "realestate",
    other = "other"
}

export interface AssetInterface {
    code: string;
    stellar: {
        code_template?: string
        issuer: string;
        status?: StatusEnum;
        display_decimals?: number;
        name: string;
        desc: string;
        conditions?: string;
        image: string;
        fixed_number?: number;
        max_number?: number;
        is_unlimited?: boolean;
        is_asset_anchored?: boolean;
        anchor_asset_type?: AnchorAssetTypeEnum;
        anchor_asset?: string;
        redemption_instructions?: string;
        collateral_addresses?: string;
        collateral_address_messages?: string;
        collateral_address_signatures?: string;
        regulated?: boolean;
        approval_server?: string;
        approval_criteria?: string;
    },
    distributor: string;
}
