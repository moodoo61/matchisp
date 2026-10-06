export type ApiSuccess<T> = {
    success: true;
    data: T;
};
export type ApiError = {
    success: false;
    message: string;
    statusCode: number;
};
export type Paginated<T> = {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
};
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};
export type AuthUser = {
    id: string;
    username: string;
    name: string;
    isActive: boolean;
    roles: string[];
    permissions: string[];
};
export type LoginResponse = {
    user: AuthUser;
    tokens: AuthTokens;
};
