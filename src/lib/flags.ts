const COUNTRY_CODES: Record<string, string> = {
  // CONCACAF
  USA: "US",
  Canada: "CA",
  Mexico: "MX",
  Panama: "PA",
  Honduras: "HN",
  "Costa Rica": "CR",
  Jamaica: "JM",
  "El Salvador": "SV",
  Guatemala: "GT",
  Cuba: "CU",
  Haiti: "HT",
  "Trinidad and Tobago": "TT",
  Curaçao: "CW",
  Curacao: "CW",

  // CONMEBOL
  Argentina: "AR",
  Brazil: "BR",
  Colombia: "CO",
  Ecuador: "EC",
  Uruguay: "UY",
  Paraguay: "PY",
  Chile: "CL",
  Bolivia: "BO",
  Peru: "PE",
  Venezuela: "VE",

  // UEFA
  Germany: "DE",
  France: "FR",
  Spain: "ES",
  England: "GB_ENG",
  Portugal: "PT",
  Netherlands: "NL",
  Belgium: "BE",
  Italy: "IT",
  Croatia: "HR",
  Denmark: "DK",
  Switzerland: "CH",
  Austria: "AT",
  Poland: "PL",
  Serbia: "RS",
  Romania: "RO",
  "Czech Republic": "CZ",
  Czechia: "CZ",
  Hungary: "HU",
  Scotland: "GB_SCT",
  Wales: "GB",
  Slovakia: "SK",
  Slovenia: "SI",
  Turkey: "TR",
  Ukraine: "UA",
  Greece: "GR",
  Norway: "NO",
  Sweden: "SE",
  Finland: "FI",
  Albania: "AL",
  Georgia: "GE",
  Bosnia: "BA",
  Iceland: "IS",
  "Northern Ireland": "GB",
  Luxembourg: "LU",
  Kosovo: "XK",

  // CAF
  Morocco: "MA",
  Senegal: "SN",
  Nigeria: "NG",
  Egypt: "EG",
  "Ivory Coast": "CI",
  Cameroon: "CM",
  Ghana: "GH",
  Algeria: "DZ",
  Tunisia: "TN",
  "South Africa": "ZA",
  Mali: "ML",
  "DR Congo": "CD",
  "Congo DR": "CD",
  "Congo, DR": "CD",
  Tanzania: "TZ",
  Zambia: "ZM",
  Angola: "AO",
  Mozambique: "MZ",
  Uganda: "UG",
  "Burkina Faso": "BF",
  Gabon: "GA",
  "Cape Verde": "CV",
  "Cabo Verde": "CV",
  "Cape Verde Islands": "CV",

  // AFC
  Japan: "JP",
  "South Korea": "KR",
  Iran: "IR",
  "Saudi Arabia": "SA",
  Australia: "AU",
  Qatar: "QA",
  Uzbekistan: "UZ",
  Jordan: "JO",
  Iraq: "IQ",
  Oman: "OM",
  China: "CN",
  Indonesia: "ID",
  Bahrain: "BH",
  UAE: "AE",
  Kuwait: "KW",
  Syria: "SY",

  // OFC
  "New Zealand": "NZ",
}

export function getCountryCode(teamName: string): string | undefined {
  return COUNTRY_CODES[teamName]
}

export const ALL_TEAMS = Object.keys(COUNTRY_CODES).sort((a, b) => a.localeCompare(b))

// Nombre en español para mostrar. La DB guarda los nombres en inglés (canónicos);
// esto traduce SOLO el texto visible. Si no hay traducción, devuelve el original
// (así nombres de jugadores u otros valores pasan sin tocar).
const SPANISH_NAMES: Record<string, string> = {
  // CONCACAF
  USA: "Estados Unidos",
  Canada: "Canadá",
  Mexico: "México",
  Panama: "Panamá",
  Haiti: "Haití",
  "Trinidad and Tobago": "Trinidad y Tobago",
  Curaçao: "Curazao",
  Curacao: "Curazao",

  // CONMEBOL
  Brazil: "Brasil",
  Peru: "Perú",

  // UEFA
  Germany: "Alemania",
  France: "Francia",
  Spain: "España",
  England: "Inglaterra",
  Netherlands: "Países Bajos",
  Belgium: "Bélgica",
  Italy: "Italia",
  Croatia: "Croacia",
  Denmark: "Dinamarca",
  Switzerland: "Suiza",
  Poland: "Polonia",
  Romania: "Rumania",
  "Czech Republic": "Chequia",
  Czechia: "Chequia",
  Hungary: "Hungría",
  Scotland: "Escocia",
  Wales: "Gales",
  Slovakia: "Eslovaquia",
  Slovenia: "Eslovenia",
  Turkey: "Turquía",
  Ukraine: "Ucrania",
  Greece: "Grecia",
  Norway: "Noruega",
  Sweden: "Suecia",
  Finland: "Finlandia",
  Iceland: "Islandia",
  "Northern Ireland": "Irlanda del Norte",
  Luxembourg: "Luxemburgo",

  // CAF
  Morocco: "Marruecos",
  Egypt: "Egipto",
  "Ivory Coast": "Costa de Marfil",
  Cameroon: "Camerún",
  Algeria: "Argelia",
  Tunisia: "Túnez",
  "South Africa": "Sudáfrica",
  Mali: "Malí",
  "DR Congo": "RD Congo",
  "Congo DR": "RD Congo",
  "Congo, DR": "RD Congo",
  Gabon: "Gabón",
  "Cape Verde": "Cabo Verde",
  "Cape Verde Islands": "Cabo Verde",

  // AFC
  Japan: "Japón",
  "South Korea": "Corea del Sur",
  Iran: "Irán",
  "Saudi Arabia": "Arabia Saudita",
  Uzbekistan: "Uzbekistán",
  Jordan: "Jordania",
  Iraq: "Irak",
  Oman: "Omán",
  Bahrain: "Baréin",
  UAE: "Emiratos Árabes Unidos",
  Syria: "Siria",

  // OFC
  "New Zealand": "Nueva Zelanda",
}

export function esTeamName(name: string): string {
  return SPANISH_NAMES[name] ?? name
}
