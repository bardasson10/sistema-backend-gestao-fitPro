export interface PaginationParams {
    page?: number | string;
    limit?: number | string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const parsePaginationParams = (page?: number | string, limit?: number | string) => {
    const pageNumber = Math.max(1, parseInt(String(page || 1), 10) || 1);
    const pageLimit = Math.max(1, Math.min(100, parseInt(String(limit || 10), 10) || 10)); // máximo de 100 por página
    const skip = (pageNumber - 1) * pageLimit;

    return {
        page: pageNumber,
        limit: pageLimit,
        skip
    };
};

export const createPaginatedResponse = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResponse<T> => {
    return {
        data,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
};
