export interface IBienIciResponse {
    realEstateAds: {
        title: string,
        description: string,
        city: string,
        photos: { url: string }[],
        price: number,
        adCreatedByPro: boolean,
        surfaceArea: number,
        roomsQuantity: number,
        id: string
    }[]
}