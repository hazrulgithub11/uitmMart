export interface Courier {
  code: string;
  name: string;
  website?: string | null;
  contact?: string | null;
  email?: string | null;
}

export const couriers: Courier[] = [
  // Malaysian couriers from tracking.my API
  { code: 'pos', name: 'Pos Malaysia', website: 'https://www.pos.com.my', contact: '1-300-300-300' },
  { code: 'jt', name: 'J&T Express', website: 'http://www.jtexpress.my', contact: '1800-82-0022', email: 'support@jtexpress.my' },
  { code: 'dhl-ecommerce', name: 'DHL Ecommerce', website: 'https://www.logistics.dhl', contact: '+60380658032' },
  { code: 'gdex', name: 'GD Express', website: 'http://www.gdexpress.com', contact: '+60364195003', email: 'helpdesk@gdexpress.com' },
  { code: 'citylink', name: 'Citylink Express', website: 'http://www.citylinkexpress.com', contact: '1300-882-489' },
  { code: 'skynet', name: 'Skynet Express', website: 'http://www.skynet.com.my', contact: '+60356239090', email: 'skynethq@skynet.com.my' },
  { code: 'shopee', name: 'Shopee Express', website: 'https://shopeexpress.com.my', contact: '+60327779222' },
  { code: 'best', name: 'Best Express', website: 'http://www.best-inc.my', contact: '1800-22-8881', email: 'info_my@best-inc.com' },
  { code: 'dpex', name: 'Dpex Express', website: 'http://www.dpex.com', contact: '+60356385711', email: 'dpexkul@dpex.com.my' },
  { code: 'airpak', name: 'Airpak Express', website: 'http://www.airpak-express.com', contact: '+6567439200', email: 'feedback@airpak-express.com' },
  { code: 'asiaxpress', name: 'Asiaxpress', website: 'https://asiaxpress.pos.com.my', contact: '+60322672260', email: 'asiaxpress.care@pos.com.my' },
  { code: 'abx', name: 'Abx Express', website: 'https://my.kex-express.com', contact: '+60380843111', email: 'my.welisten@kex-express.com' },
  { code: 'kex', name: 'KEX Express', website: 'https://my.kex-express.com', contact: '+60380843111', email: 'my.welisten@kex-express.com' },
  { code: 'ups', name: 'UPS Express', website: 'https://www.ups.com', contact: '1800-1800-88' },
  { code: 'tnt', name: 'TNT Express', website: 'https://www.tnt.com', contact: '1300-882-882' },
  { code: 'zepto', name: 'ZeptoExpress', website: 'https://www.zeptoexpress.com', contact: '1300-88-9378', email: 'support@zeptoexpress.com' },
  { code: 'zto', name: 'ZTO Express', website: 'http://my.ztoglobal.com', contact: '+60126568858' },
  { code: 'yunda', name: 'Yunda Express', website: 'http://www.yunda.asia', contact: '1300-88-8381' },
  { code: 'jtcargo', name: 'J&T Cargo', website: 'https://www.jtcargo.my', contact: '1800-18-0018', email: 'support@jtcargo.my' },
  { code: 'lineclear', name: 'LineClear Express', website: 'http://www.lineclearexpress.com', contact: '+60355905590' },
  { code: 'pickupp', name: 'Pickupp', website: 'https://my.pickupp.io', contact: '+60362000715', email: 'my@pickupp.io' },
  { code: 'qxpress', name: 'Qxpress', website: 'http://www.qxpress.asia', email: 'info@qxpress.my' },
  { code: 'janio', name: 'Janio', website: 'https://janio.asia', email: 'support@janio.asia' },
  { code: 'teleport', name: 'Teleport', website: 'https://www.teleport.asia' },
  { code: 'toll', name: 'Toll Express', website: 'http://www.tollgroup.com/my/malaysia', contact: '+60333222800' },
  { code: 'fmx', name: 'FMX', website: 'https://www.fmx.asia', contact: '1700-818-369', email: 'fmxcs@freightmark.com.my' },
  { code: 'wepost', name: 'WePost', website: 'https://www.wepost.com.my', contact: '+6078180383', email: 'support@wepost.com.my' },
  { code: 'sendy', name: 'Sendy Express', website: 'https://www.sendy.com.my', contact: '+6078180383', email: 'support@sendy.com.my' },
  { code: 'isend', name: 'iSend Logistics', website: 'https://my.isendlogistics.com', contact: '1800-22-1336', email: 'mysupport@isendlogistics.com' },
  { code: 'parcelhub', name: 'Parcelhub', website: 'https://www.parcelhub.com.my', contact: '+60189651544' },
  { code: 'whallo', name: 'Whallo', website: 'https://whallo.com.my', contact: '+60189651544', email: 'whallo@parcelhub.com.my' }
]; 