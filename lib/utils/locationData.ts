/**
 * Comprehensive Madhya Pradesh administrative location hierarchy
 * Division -> District -> Block -> Gram Panchayat -> Village
 */

export interface LocationHierarchyNode {
  id: string;
  name: string;
  districts?: {
    id: string;
    name: string;
    blocks?: {
      id: string;
      name: string;
      panchayats?: {
        id: string;
        name: string;
        villages?: string[];
      }[];
    }[];
  }[];
}

export const MP_LOCATION_HIERARCHY: LocationHierarchyNode[] = [
  {
    id: 'div-bhopal',
    name: 'Bhopal Division',
    districts: [
      {
        id: 'dst-bhopal',
        name: 'Bhopal',
        blocks: [
          {
            id: 'blk-bhopal-rural',
            name: 'Bhopal Rural',
            panchayats: [
              { id: 'gp-kolar-03', name: 'Kolar Ward 3', villages: ['Kolar Kalan', 'Kolar Gaon', 'Mandideep Border'] },
              { id: 'gp-fanda-01', name: 'Fanda Kalan', villages: ['Fanda Kalan', 'Fanda Khurd', 'Bairagarh Chichali'] },
            ],
          },
          {
            id: 'blk-berasia',
            name: 'Berasia',
            panchayats: [
              { id: 'gp-berasia-01', name: 'Berasia Dehat', villages: ['Berasia Gaon', 'Gunga', 'Dillod'] },
              { id: 'gp-berasia-02', name: 'Runaha', villages: ['Runaha', 'Nazirabad', 'Lalariya'] },
            ],
          },
        ],
      },
      {
        id: 'dst-sehore',
        name: 'Sehore',
        blocks: [
          {
            id: 'blk-ashta',
            name: 'Ashta',
            panchayats: [
              { id: 'gp-kothri', name: 'Kothri', villages: ['Kothri Kalan', 'Kothri Khurd', 'Badnagar'] },
              { id: 'gp-metwada', name: 'Metwada', villages: ['Metwada', 'Hingoni', 'Khajuria'] },
            ],
          },
          {
            id: 'blk-budhni',
            name: 'Budhni',
            panchayats: [
              { id: 'gp-shahganj', name: 'Shahganj', villages: ['Shahganj Village', 'Bakra', 'Midghat'] },
              { id: 'gp-bakhtra', name: 'Bakhtra', villages: ['Bakhtra', 'Joshipur', 'Kalyanpur'] },
            ],
          },
          {
            id: 'blk-sehore-rural',
            name: 'Sehore Rural',
            panchayats: [
              { id: 'gp-bilkisganj', name: 'Bilkisganj', villages: ['Bilkisganj', 'Mahuakheda', 'Shyampur'] },
            ],
          },
        ],
      },
      {
        id: 'dst-raisen',
        name: 'Raisen',
        blocks: [
          {
            id: 'blk-sanchi',
            name: 'Sanchi',
            panchayats: [
              { id: 'gp-sanchi-01', name: 'Sanchi Dehat', villages: ['Sanchi Gaon', 'Nagori', 'Vidisha Border'] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'div-ujjain',
    name: 'Ujjain Division',
    districts: [
      {
        id: 'dst-ujjain',
        name: 'Ujjain',
        blocks: [
          {
            id: 'blk-ujjain-urban',
            name: 'Ujjain Urban',
            panchayats: [
              { id: 'gp-bharkhedi', name: 'Bharkhedi', villages: ['Bharkhedi Kalan', 'Bharkhedi Khurd', 'Lekoda'] },
              { id: 'gp-tajpur', name: 'Tajpur', villages: ['Tajpur', 'Panthpiplai', 'Ghattia'] },
            ],
          },
          {
            id: 'blk-tarana',
            name: 'Tarana',
            panchayats: [
              { id: 'gp-kayatha', name: 'Kayatha', villages: ['Kayatha', 'Rupakhedi', 'Sumrakheda'] },
            ],
          },
        ],
      },
      {
        id: 'dst-dewas',
        name: 'Dewas',
        blocks: [
          {
            id: 'blk-sonkatch',
            name: 'Sonkatch',
            panchayats: [
              { id: 'gp-bhaurasa', name: 'Bhaurasa', villages: ['Bhaurasa', 'Gandharvpur', 'Pipalrawan'] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'div-indore',
    name: 'Indore Division',
    districts: [
      {
        id: 'dst-indore',
        name: 'Indore',
        blocks: [
          {
            id: 'blk-sanwer',
            name: 'Sanwer',
            panchayats: [
              { id: 'gp-sanwer-kalan', name: 'Sanwer Kalan', villages: ['Sanwer Kalan', 'Dharmat', 'Ajnod'] },
              { id: 'gp-chandrawatiganj', name: 'Chandrawatiganj', villages: ['Chandrawatiganj', 'Barlai', 'Kshipra'] },
            ],
          },
          {
            id: 'blk-depalpur',
            name: 'Depalpur',
            panchayats: [
              { id: 'gp-depalpur-05', name: 'Depalpur Ward 5', villages: ['Depalpur Ward 5', 'Gautampura', 'Betma'] },
            ],
          },
        ],
      },
      {
        id: 'dst-dhar',
        name: 'Dhar',
        blocks: [
          {
            id: 'blk-dhar-rural',
            name: 'Dhar Rural',
            panchayats: [
              { id: 'gp-pithampur-02', name: 'Pithampur Sector 2', villages: ['Pithampur Sector 2', 'Sagore', 'Kheda'] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'div-gwalior',
    name: 'Gwalior Division',
    districts: [
      {
        id: 'dst-gwalior',
        name: 'Gwalior',
        blocks: [
          {
            id: 'blk-gwalior-a',
            name: 'Gwalior Block A',
            panchayats: [
              { id: 'gp-bhitarwar-khurd', name: 'Bhitarwar Khurd', villages: ['Bhitarwar Khurd', 'Mohna', 'Antari'] },
              { id: 'gp-dabra', name: 'Dabra Dehat', villages: ['Dabra Gaon', 'Chinor', 'Picchore'] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'div-jabalpur',
    name: 'Jabalpur Division',
    districts: [
      {
        id: 'dst-jabalpur',
        name: 'Jabalpur',
        blocks: [
          {
            id: 'blk-sihora',
            name: 'Sihora',
            panchayats: [
              { id: 'gp-sihora-khurd', name: 'Sihora Khurd', villages: ['Sihora Khurd', 'Majholi', 'Panagar'] },
            ],
          },
        ],
      },
      {
        id: 'dst-narsinghpur',
        name: 'Narsinghpur',
        blocks: [
          {
            id: 'blk-gadarwara',
            name: 'Gadarwara',
            panchayats: [
              { id: 'gp-narsinghpur-basti', name: 'Narsinghpur Basti', villages: ['Narsinghpur Basti', 'Kareli', 'Gotegaon'] },
            ],
          },
        ],
      },
    ],
  },
];

export interface LocationFilterState {
  division?: string;
  district?: string;
  block?: string;
  gramPanchayat?: string;
  village?: string;
}
