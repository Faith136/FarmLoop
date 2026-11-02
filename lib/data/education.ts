export interface EducationalMaterial {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  commonUses: string[];
  environmentalBenefits: string;
  potentialBuyers: string[];
  marketplaceHref: string;
}

export const educationalMaterials: EducationalMaterial[] = [
  {
    id: "maize-stalks",
    name: "Maize stalks",
    category: "Crop residues",
    icon: "🌾",
    description: "Dry stems left after maize is harvested.",
    commonUses: [
      "Prepared as feed for livestock.",
      "Used as mulch or added to a compost pile.",
      "Used in some biomass applications.",
    ],
    environmentalBenefits:
      "Collecting and reusing stalks can reduce the amount left for open-field burning or disposal.",
    potentialBuyers: ["Livestock keepers", "Compost makers", "Biomass users"],
    marketplaceHref: "/marketplace?search=Maize+stalks",
  },
  {
    id: "maize-cobs",
    name: "Maize cobs",
    category: "Crop residues",
    icon: "🌽",
    description: "The hard inner part of the maize ear, left after the kernels are removed.",
    commonUses: [
      "Added to compost after breaking them into smaller pieces.",
      "Used as fuel where suitable equipment and safe practices are available.",
      "Used in some animal bedding mixes.",
    ],
    environmentalBenefits:
      "Finding a use for cobs can keep this crop residue out of unmanaged waste piles.",
    potentialBuyers: ["Compost makers", "Small-scale processors", "Livestock keepers"],
    marketplaceHref: "/marketplace?category=Crop+residue",
  },
  {
    id: "rice-husks",
    name: "Rice husks",
    category: "Crop residues",
    icon: "🌱",
    description: "Protective outer shells separated from rice grains during milling.",
    commonUses: [
      "Mixed into compost or used as a soil cover.",
      "Used as animal bedding.",
      "Used in some processing and growing applications.",
    ],
    environmentalBenefits:
      "Reuse gives a rice-milling by-product a purpose instead of leaving it unused.",
    potentialBuyers: ["Compost makers", "Livestock keepers", "Growers"],
    marketplaceHref: "/marketplace?search=Rice+husks",
  },
  {
    id: "poultry-manure",
    name: "Poultry manure",
    category: "Animal manure",
    icon: "🐔",
    description: "Manure collected from poultry housing.",
    commonUses: [
      "Composted before it is applied to soil.",
      "Used as an organic soil amendment when handled and applied appropriately.",
    ],
    environmentalBenefits:
      "Managed composting can make use of manure and help limit unmanaged waste. Follow local guidance for handling and application.",
    potentialBuyers: ["Crop growers", "Compost makers", "Garden suppliers"],
    marketplaceHref: "/marketplace?search=Poultry+manure",
  },
  {
    id: "dairy-manure",
    name: "Dairy manure",
    category: "Animal manure",
    icon: "🐄",
    description: "Manure collected from dairy cattle and farmyards.",
    commonUses: [
      "Composted for use as a soil amendment.",
      "Applied to fields in line with local guidance and crop needs.",
    ],
    environmentalBenefits:
      "Collecting and managing manure can reduce unmanaged waste and return organic material to the soil.",
    potentialBuyers: ["Crop growers", "Compost makers", "Farm input suppliers"],
    marketplaceHref: "/marketplace?category=Animal+manure",
  },
  {
    id: "coffee-husks",
    name: "Coffee husks",
    category: "Processing waste",
    icon: "☕",
    description: "Plant material separated from coffee beans during processing.",
    commonUses: [
      "Added to compost after suitable preparation.",
      "Used as mulch where appropriate.",
      "Used in some biomass applications.",
    ],
    environmentalBenefits:
      "Reusing coffee husks can reduce the amount of processing material that is discarded.",
    potentialBuyers: ["Compost makers", "Growers", "Biomass users"],
    marketplaceHref: "/marketplace?search=Coffee+husks",
  },
  {
    id: "sugarcane-bagasse",
    name: "Sugarcane bagasse",
    category: "Processing waste",
    icon: "🌿",
    description: "Fibrous material remaining after juice is extracted from sugarcane.",
    commonUses: [
      "Used as fuel at some processing facilities.",
      "Added to compost or used as mulch when suitable.",
      "Used as a fibre input in some manufacturing processes.",
    ],
    environmentalBenefits:
      "Using bagasse can make productive use of material left over from sugar processing.",
    potentialBuyers: ["Sugar processors", "Compost makers", "Manufacturers"],
    marketplaceHref: "/marketplace?search=Sugarcane+bagasse",
  },
  {
    id: "compost",
    name: "Compost",
    category: "Soil amendments",
    icon: "🌱",
    description: "Organic material broken down under managed composting conditions.",
    commonUses: [
      "Mixed into soil or growing media.",
      "Used around plants as a soil cover.",
    ],
    environmentalBenefits:
      "Composting can turn suitable organic residues into a useful soil amendment and reduce material sent for disposal.",
    potentialBuyers: ["Crop growers", "Nurseries", "Garden suppliers"],
    marketplaceHref: "/marketplace?search=compost",
  },
  {
    id: "organic-soil-amendments",
    name: "Other organic soil amendments",
    category: "Soil amendments",
    icon: "🪴",
    description: "Prepared organic materials used to support soil structure and add organic matter.",
    commonUses: [
      "Incorporated into soil before planting.",
      "Used in growing mixes when suited to the crop.",
    ],
    environmentalBenefits:
      "Using suitable organic materials can help put farm and processing by-products to use rather than discarding them.",
    potentialBuyers: ["Crop growers", "Nurseries", "Garden suppliers"],
    marketplaceHref: "/marketplace?search=compost",
  },
];
