export const MOCK_COMPANY_DATA: Record<string, any> = {
  "2018/123456/07": {
    verified: true,
    companyName: "Global Fresh SA Pty LTD",
    tradingName: "Global Fresh SA",
    registrationDate: "2018-03-15",
    status: "Active",
    entityType: "PTY LTD",
    directors: [
      {
        name: "Thandi Nkosi",
        id: "7601230093085",
        role: "Chief Executive Officer",
        appointmentDate: "2018-03-15",
        nationality: "South African"
      },
      {
        name: "Sean King",
        id: "7203155082087",
        role: "Chief Operating Officer",
        appointmentDate: "2018-03-15",
        nationality: "South African"
      },
      {
        name: "Hendrik Venter",
        role: "Non-Executive Director",
        appointmentDate: "2021-01-01",
        nationality: "South African"
      }
    ],
    registeredAddress: "Unit 12, Techno Park Industrial Estate, Stellenbosch, 7600",
    businessProfile: {
      overview: "Food processing company specializing in dried fruit and nut products using traditional South African ingredients with modern preservation techniques.",
      foundingStory: "Founded in 2018 when Sean King, with a background in food technology and previous experience at Tiger Brands, partnered with Thandi Nkosi, who had deep connections with local farming communities through her work with the Western Cape Farmers Association.",
      facilitySize: "750m² facility in Stellenbosch industrial area",
      employeeCount: {
        fullTime: {
          total: 12,
          breakdown: {
            management: 3,
            sales: 2,
            production: 7
          }
        },
        seasonal: "8-10 seasonal workers during harvest periods (Feb-May)"
      },
      productionCapacity: {
        current: "6,000 units monthly",
        utilization: "65%",
        maximum: "9,200 units monthly"
      },
      revenue: {
        current: "R8.5 million (2023/2024)",
        previous: "R6.7 million (2022/2023)",
        growth: "27%",
        profitMargin: "14% EBITDA"
      },
      certifications: [
        {
          name: "HACCP Level 1",
          obtained: "2020",
          renewed: "2023"
        },
        "SA Food Safety Certification",
        "Food Safety Act Compliance Certificate",
        "Department of Health Compliance Certificate"
      ],
      pendingCertifications: [
        {
          name: "ISO 22000",
          expected: "November 2024"
        }
      ],
      infrastructure: {
        facility: {
          total: "750m²",
          coldStorage: "150m²",
          laboratory: "Quality Testing Laboratory"
        },
        equipment: [
          {
            type: "Dehydrator Systems",
            details: "2x Excalibur Commercial 2020 models"
          },
          {
            type: "Packaging Line",
            details: "1x PackTech S300, installed 2021"
          }
        ],
        investments: {
          recent: {
            amount: "R1.2 million",
            purpose: "packaging automation",
            year: 2021
          }
        }
      }
    },
    products: [
      {
        name: "Cape Harvest",
        trademark: "ZA202004123",
        categories: [
          {
            name: "Premium Mango Slices",
            sizes: ["200g", "500g"]
          },
          {
            name: "Golden Apricot Selection",
            sizes: ["250g"]
          },
          {
            name: "Cape Mixed Fruit Medley",
            sizes: ["300g"]
          },
          {
            name: "Superfood Berry Mix",
            sizes: ["150g"]
          }
        ]
      },
      {
        name: "Safari Blend",
        trademark: "ZA202104567",
        categories: [
          {
            name: "Kalahari Salt & Herb Mix",
            sizes: ["200g", "400g"]
          },
          {
            name: "Rooibos Infused Almond Mix",
            sizes: ["200g"]
          },
          {
            name: "Bushveld Spice Blend",
            sizes: ["250g"]
          },
          {
            name: "Honey Roasted Macadamia & Pecan Mix",
            sizes: ["150g"]
          }
        ]
      },
      {
        name: "Winelands Collection",
        trademark: "ZA202205789",
        categories: [
          {
            name: "Stellenbosch Selection",
            type: "Combination box with dried fruits and nuts"
          },
          {
            name: "Franschhoek Finest",
            type: "Premium gift box with wine pairing recommendations"
          },
          {
            name: "Corporate Gift Program",
            type: "Customizable packaging with client branding"
          }
        ]
      }
    ],
    marketPresence: {
      retail: {
        specialtyStores: 35,
        supermarkets: [
          {
            chain: "Woolworths",
            stores: 8,
            region: "Western Cape"
          },
          {
            chain: "SPAR",
            stores: 12,
            region: "Gauteng"
          }
        ]
      },
      online: {
        website: {
          platform: "WooCommerce",
          visitors: 12000,
          conversionRate: 3.2,
          percentageOfSales: 18
        },
        marketplaces: ["Takealot"]
      },
      markets: ["Stellenbosch Farmers Market", "Franschhoek Farmers Market"]
    },
    financials: {
      bankingDetails: {
        bank: "First National Bank",
        accountNumber: "62453098761"
      },
      accountants: "Mitchell & Associates (Cape Town)",
      ratios: {
        currentRatio: 1.8,
        cashReserves: 750000,
        creditFacility: {
          limit: 1000000,
          utilization: 25
        }
      }
    },
    exportReadiness: {
      experience: "Limited to individual orders to Namibia",
      inquiries: [
        {
          company: "Green Basket Distributors",
          location: "Windhoek, Namibia",
          date: "January 2024"
        },
        {
          company: "Gourmet Selection Ltd",
          location: "Gaborone, Botswana",
          date: "February 2024"
        },
        {
          company: "Food Lovers Market",
          location: "Maputo, Mozambique",
          date: "March 2024"
        }
      ],
      targetMarkets: {
        primary: ["Namibia", "Botswana"],
        secondary: ["UAE", "UK"]
      },
      exportCapacity: "30% of production capacity",
      budget: 350000,
      timeline: "6-8 months"
    }
  }
};

export const MOCK_TAX_DATA: Record<string, any> = {
  "9876543210": {
    compliant: true,
    taxClearanceValid: true,
    vatRegistered: true,
    vatNumber: "4480123456",
    lastFilingDate: "2024-01-15",
    taxStatus: {
      returns: "Up to date",
      assessments: "All completed",
      payments: "Current"
    },
    importExportStatus: {
      code: "Pending application",
      status: "In progress",
      applicationDate: "2024-02-01"
    }
  }
};

export const MOCK_CONTACT_DATA = {
  validEmails: [
    "thandi.nkosi@globalfreshsa.co.za",
    "sean.king@globalfreshsa.co.za",
    "info@globalfreshsa.co.za"
  ],
  validPhones: [
    "0218555123",  // Main office
    "0825559876",  // Thandi Nkosi
    "0835557432"   // Sean King
  ],
  website: "www.globalfreshsa.co.za",
  socialMedia: {
    linkedin: {
      handle: "global-fresh-sa",
      followers: 820
    },
    facebook: {
      handle: "GlobalFreshSA",
      followers: 6500
    },
    instagram: {
      handle: "globalfreshsa",
      followers: 4200
    }
  },
  newsletter: {
    subscribers: 3800,
    frequency: "Monthly"
  }
};

export const MOCK_DIGITAL_PRESENCE = {
  websiteDetails: {
    url: "www.globalfreshsa.co.za",
    platform: "WooCommerce",
    lastUpdated: "2024-01-20",
    hasEcommerce: true,
    monthlyVisitors: 12000,
    conversionRate: 3.2,
    features: [
      "E-commerce Platform",
      "Product Catalog",
      "Company History",
      "Contact Information",
      "Distribution Network",
      "Newsletter Signup"
    ]
  },
  systems: {
    accounting: "Xero (since 2020)",
    crm: "HubSpot Starter (since 2022)",
    communication: "Microsoft 365 Business Standard",
    planned: {
      erp: {
        system: "SAP Business One",
        implementation: "Q3 2024"
      },
      bi: {
        system: "PowerBI",
        implementation: "Q4 2024"
      }
    }
  },
  businessListings: [
    {
      platform: "Google Business",
      verified: true,
      rating: 4.5,
      reviewCount: 28
    },
    {
      platform: "Yellow Pages SA",
      verified: true,
      category: "Food Manufacturers & Processors"
    }
  ],
  prCoverage: [
    {
      publication: "Taste Magazine",
      date: "July 2023",
      type: "Feature Article"
    },
    {
      publication: "Business Day",
      date: "November 2023",
      type: "SME Spotlight"
    }
  ],
  awards: [
    {
      name: "Best Food Innovation",
      event: "Stellenbosch Small Business Awards",
      year: "2022"
    },
    {
      name: "Western Cape Export Readiness Certificate",
      year: "2024",
      category: "SME Development"
    }
  ]
}; 