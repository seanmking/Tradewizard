export interface ProductItem {
  name: string;
}

export interface ProductCategory {
  name: string;
  items: ProductItem[];
}

export interface WebsiteData {
  companyInfo: {
    name: string;
    founded: number;
    location: string;
    contact: {
      email: string;
      phone: string;
    };
    registrationDetails: {
      regNumber: string;
      vat: string;
    };
  };
  products: {
    categories: ProductCategory[];
  };
} 