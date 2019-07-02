export interface IAppart {
    timestamp: number,
    title: string,
    description: string,
    departement: string,
    photos: string[],
    price: number
    adCreatedByPro: boolean
    //district: resp.realEstateAds[i].district.name,
    surfaceArea: number,
    url: string
    id: string
    origin: string,
    notes: string | null
}