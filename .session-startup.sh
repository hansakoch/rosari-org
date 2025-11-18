#!/bin/bash

# Icebergsites Project Session Startup Script
# This script collects all business information needed for a new icebergsites project

echo "================================================="
echo "   ICEBERGSITES PROJECT SETUP - ICEBERG MEDIA"
echo "================================================="
echo ""

# Function to prompt for input with validation
prompt_required() {
    local var_name=$1
    local prompt_text=$2
    local value=""

    while [ -z "$value" ]; do
        read -p "$prompt_text: " value
        if [ -z "$value" ]; then
            echo "❌ This field is required. Please try again."
        fi
    done

    echo "$value"
}

prompt_optional() {
    local prompt_text=$1
    local value=""
    read -p "$prompt_text (optional): " value
    echo "$value"
}

# ============================================
# COMPANY IDENTIFICATION
# ============================================
echo "📋 COMPANY IDENTIFICATION"
echo "─────────────────────────"
COMPANY_BIZ_NAME=$(prompt_required "company_biz_name" "Business Name (for repo: Iceberg-Media/COMPANY_BIZ_NAME)")
COMPANY_LEGAL_NAME=$(prompt_optional "Legal Business Name (if different)")
COMPANY_DBA=$(prompt_optional "DBA / Trading As")

echo ""

# ============================================
# NAP+W (Name, Address, Phone, Website)
# ============================================
echo "📍 NAP+W - PRIMARY BUSINESS INFORMATION"
echo "────────────────────────────────────────"
NAP_NAME=$(prompt_required "nap_name" "Official Business Name (for citations)")
NAP_ADDRESS_STREET=$(prompt_required "nap_address_street" "Street Address")
NAP_ADDRESS_CITY=$(prompt_required "nap_address_city" "City")
NAP_ADDRESS_STATE=$(prompt_required "nap_address_state" "State/Province")
NAP_ADDRESS_ZIP=$(prompt_required "nap_address_zip" "ZIP/Postal Code")
NAP_ADDRESS_COUNTRY=$(prompt_required "nap_address_country" "Country")
NAP_PHONE=$(prompt_required "nap_phone" "Primary Phone Number")
NAP_WEBSITE=$(prompt_required "nap_website" "Website URL")

echo ""

# ============================================
# GOOGLE BUSINESS PROFILE - MOST IMPORTANT
# ============================================
echo "🌟 GOOGLE BUSINESS PROFILE (MOST IMPORTANT)"
echo "────────────────────────────────────────────"
GBP_SHARE_LINK=$(prompt_required "gbp_share_link" "GBP Share Link")
GBP_PLACE_ID=$(prompt_optional "GBP Place ID")
GBP_CID=$(prompt_optional "GBP CID")

echo ""

# ============================================
# SOCIAL MEDIA PLATFORMS
# ============================================
echo "📱 SOCIAL MEDIA PLATFORMS"
echo "─────────────────────────"
SOCIAL_FACEBOOK=$(prompt_optional "Facebook URL")
SOCIAL_INSTAGRAM=$(prompt_optional "Instagram URL")
SOCIAL_TWITTER=$(prompt_optional "Twitter/X URL")
SOCIAL_LINKEDIN=$(prompt_optional "LinkedIn URL")
SOCIAL_YOUTUBE=$(prompt_optional "YouTube URL")
SOCIAL_TIKTOK=$(prompt_optional "TikTok URL")
SOCIAL_PINTEREST=$(prompt_optional "Pinterest URL")
SOCIAL_YELP=$(prompt_optional "Yelp URL")

echo ""

# ============================================
# MEMBERSHIPS & ACCREDITATIONS
# ============================================
echo "🏆 MEMBERSHIPS & ACCREDITATIONS"
echo "───────────────────────────────"
ACCREDITATION_BBB=$(prompt_optional "BBB Accreditation (Yes/No and Link)")
ACCREDITATION_CHAMBER=$(prompt_optional "Chamber of Commerce Membership")
ACCREDITATION_PROFESSIONAL=$(prompt_optional "Professional Associations/Certifications")
ACCREDITATION_AWARDS=$(prompt_optional "Industry Awards/Recognition")
ACCREDITATION_OTHER=$(prompt_optional "Other Memberships/Accreditations")

echo ""

# ============================================
# DIRECTORY LISTINGS
# ============================================
echo "📂 DIRECTORY LISTINGS"
echo "─────────────────────"
DIRECTORY_APPLE_MAPS=$(prompt_optional "Apple Maps Business URL")
DIRECTORY_BING_PLACES=$(prompt_optional "Bing Places URL")
DIRECTORY_YELLOW_PAGES=$(prompt_optional "Yellow Pages URL")
DIRECTORY_ANGI=$(prompt_optional "Angi/Angie's List URL")
DIRECTORY_HOUZZ=$(prompt_optional "Houzz URL")
DIRECTORY_THUMBTACK=$(prompt_optional "Thumbtack URL")
DIRECTORY_OTHER=$(prompt_optional "Other Important Directories (comma-separated)")

echo ""

# ============================================
# ADDITIONAL CONTACT INFO
# ============================================
echo "📞 ADDITIONAL CONTACT INFORMATION"
echo "──────────────────────────────────"
CONTACT_EMAIL=$(prompt_optional "Primary Email")
CONTACT_PHONE_ALT=$(prompt_optional "Alternative Phone")
CONTACT_FAX=$(prompt_optional "Fax Number")
CONTACT_HOURS=$(prompt_optional "Business Hours (e.g., Mon-Fri 9AM-5PM)")

echo ""

# ============================================
# BUSINESS DETAILS
# ============================================
echo "💼 BUSINESS DETAILS"
echo "───────────────────"
BUSINESS_INDUSTRY=$(prompt_optional "Industry/Sector")
BUSINESS_SERVICES=$(prompt_optional "Primary Services/Products")
BUSINESS_FOUNDED=$(prompt_optional "Year Founded")
BUSINESS_EMPLOYEES=$(prompt_optional "Number of Employees")

echo ""
echo "================================================="
echo "   GENERATING CONFIGURATION FILE"
echo "================================================="

# Create the configuration file
CONFIG_FILE=".business-config.json"
cat > "$CONFIG_FILE" << EOF
{
  "projectInfo": {
    "companyBizName": "$COMPANY_BIZ_NAME",
    "companyLegalName": "$COMPANY_LEGAL_NAME",
    "companyDBA": "$COMPANY_DBA",
    "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "organization": "Iceberg-Media",
    "repository": "Iceberg-Media/$COMPANY_BIZ_NAME"
  },
  "napw": {
    "name": "$NAP_NAME",
    "address": {
      "street": "$NAP_ADDRESS_STREET",
      "city": "$NAP_ADDRESS_CITY",
      "state": "$NAP_ADDRESS_STATE",
      "zip": "$NAP_ADDRESS_ZIP",
      "country": "$NAP_ADDRESS_COUNTRY",
      "full": "$NAP_ADDRESS_STREET, $NAP_ADDRESS_CITY, $NAP_ADDRESS_STATE $NAP_ADDRESS_ZIP, $NAP_ADDRESS_COUNTRY"
    },
    "phone": "$NAP_PHONE",
    "website": "$NAP_WEBSITE"
  },
  "googleBusinessProfile": {
    "shareLink": "$GBP_SHARE_LINK",
    "placeId": "$GBP_PLACE_ID",
    "cid": "$GBP_CID"
  },
  "socialMedia": {
    "facebook": "$SOCIAL_FACEBOOK",
    "instagram": "$SOCIAL_INSTAGRAM",
    "twitter": "$SOCIAL_TWITTER",
    "linkedin": "$SOCIAL_LINKEDIN",
    "youtube": "$SOCIAL_YOUTUBE",
    "tiktok": "$SOCIAL_TIKTOK",
    "pinterest": "$SOCIAL_PINTEREST",
    "yelp": "$SOCIAL_YELP"
  },
  "membershipsAccreditations": {
    "bbb": "$ACCREDITATION_BBB",
    "chamberOfCommerce": "$ACCREDITATION_CHAMBER",
    "professionalAssociations": "$ACCREDITATION_PROFESSIONAL",
    "awards": "$ACCREDITATION_AWARDS",
    "other": "$ACCREDITATION_OTHER"
  },
  "directoryListings": {
    "appleMaps": "$DIRECTORY_APPLE_MAPS",
    "bingPlaces": "$DIRECTORY_BING_PLACES",
    "yellowPages": "$DIRECTORY_YELLOW_PAGES",
    "angi": "$DIRECTORY_ANGI",
    "houzz": "$DIRECTORY_HOUZZ",
    "thumbtack": "$DIRECTORY_THUMBTACK",
    "other": "$DIRECTORY_OTHER"
  },
  "contactInfo": {
    "email": "$CONTACT_EMAIL",
    "phoneAlt": "$CONTACT_PHONE_ALT",
    "fax": "$CONTACT_FAX",
    "businessHours": "$CONTACT_HOURS"
  },
  "businessDetails": {
    "industry": "$BUSINESS_INDUSTRY",
    "services": "$BUSINESS_SERVICES",
    "founded": "$BUSINESS_FOUNDED",
    "employees": "$BUSINESS_EMPLOYEES"
  },
  "cloudflare": {
    "accountId": "0870b0bdbc14bcd31f43fe5e82c3ee8e",
    "organization": "Iceberg-Media"
  }
}
EOF

echo "✅ Configuration saved to: $CONFIG_FILE"
echo ""
echo "================================================="
echo "   SETUP COMPLETE!"
echo "================================================="
echo ""
echo "Repository: Iceberg-Media/$COMPANY_BIZ_NAME"
echo "GBP Link: $GBP_SHARE_LINK"
echo "Website: $NAP_WEBSITE"
echo ""
echo "Next steps:"
echo "1. Review .business-config.json"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run dev' to start local development"
echo "4. Run 'npm run deploy' to deploy to Cloudflare"
echo ""
echo "Configuration file has been created and is ready to use!"
echo "================================================="
