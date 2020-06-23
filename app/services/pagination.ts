export default function pagination(count, paginate) {
    const numberOfPages = Math.ceil(count / paginate.limit);
    const nextPage = parseInt(paginate.page, 10) + 1;
    const meta = {
        page: paginate.page,
        limit: paginate.limit,
        previousPage: (paginate.page > 1) ? parseInt(paginate.page, 10) - 1 : false,
        nextPage: (numberOfPages >= nextPage) ? nextPage : false,
        pageCount: numberOfPages,
        total: count
    };
    return meta;
}