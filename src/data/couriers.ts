export interface Courier {
  code: string;
  name: string;
  website?: string | null;
  contact?: string | null;
  email?: string | null;
}

export const couriers: Courier[] = [
  // Major Malaysian couriers
  { code: 'poslaju', name: 'Pos Laju' },
  { code: 'jnt', name: 'J&T Express' },
  { code: 'dhl', name: 'DHL' },
  { code: 'gdex', name: 'GDEX' },
  { code: 'citylink', name: 'City-Link Express' },
  { code: 'skynet', name: 'SkyNet' },
  { code: 'ninjavan', name: 'Ninja Van' },
  { code: 'fedex', name: 'FedEx' },
  { code: 'shopee', name: 'Shopee Express' },
  { code: 'lazada', name: 'LEX Malaysia' },
  { code: 'aramex', name: 'Aramex' },
  { code: 'dpex', name: 'DPEX Express' },
  { code: 'taqbin', name: 'Ta-Q-Bin' },
  { code: 'airpak', name: 'Airpak Express' },
  { code: 'nationwide', name: 'Nationwide Express' },
  { code: 'asiaxpress', name: 'AsiaXpress' },
  { code: 'mypostherapeutic', name: 'MyPost Therapeutic' },
  { code: 'best', name: 'Best Express' },
  { code: 'flash', name: 'Flash Express' },
  { code: 'poslajuint', name: 'Pos Laju International' },
  { code: 'zto', name: 'ZTO Express' },
  { code: 'skybox', name: 'SkyBox' },
  { code: 'ups', name: 'UPS' },
  { code: 'abx', name: 'ABX Express' },
  { code: 'lalamove', name: 'Lalamove' },
  { code: 'parcel', name: 'Parcel365' },
  { code: 'grab', name: 'GrabExpress' },
  { code: 'transporter', name: 'Transporter' },
  // Additional international couriers
  { code: 'usps', name: 'USPS' },
  { code: 'royalmail', name: 'Royal Mail' },
  { code: 'singpost', name: 'Singapore Post' },
  { code: 'auspost', name: 'Australia Post' },
  { code: 'chinapost', name: 'China Post' },
  { code: 'japanpost', name: 'Japan Post' },
  { code: 'koreapost', name: 'Korea Post' },
  { code: 'indiapost', name: 'India Post' },
  { code: 'thailandpost', name: 'Thailand Post' },
  { code: 'canadapost', name: 'Canada Post' },
  { code: 'correos', name: 'Correos Spain' },
  { code: 'chronopost', name: 'Chronopost' }
]; 