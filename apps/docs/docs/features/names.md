---
sidebar_position: 4
---

# Name Database

Little Origin includes a comprehensive database of baby names from around the world. Explore names from different cultures, origins, and traditions.

## Database Overview

### Supported Countries

Names from 7 countries are included:

| Country | Count | Years Available |
|---------|-------|-----------------|
| 🇺🇸 United States | ~10,000 | 1950-2023 |
| 🇬🇧 United Kingdom | ~8,000 | 1950-2023 |
| 🇫🇷 France | ~6,000 | 1950-2023 |
| 🇪🇸 Spain | ~7,000 | 1950-2023 |
| 🇩🇪 Germany | ~6,000 | 1950-2023 |
| 🇮🇹 Italy | ~7,000 | 1950-2023 |
| 🇧🇷 Brazil | ~8,000 | 1950-2023 |

### Total Database

- **~52,000 unique names**
- **Multiple gender assignments** where applicable
- **Popularity rankings** by country and year
- **Historical data** spanning 7+ decades

## Name Information

Each name includes:

### Basic Data

- **Name** - The baby name (e.g., "Emma", "Liam")
- **Gender** - Male, Female, or Neutral
- **Country** - Country of origin/association
- **Year** - Year of popularity data
- **Rank** - Popularity ranking (1 = most popular)
- **Count** - Number of babies given that name

### Metadata

- **Origin** - Cultural or linguistic origin
- **Meaning** - Name meaning (where available)
- **Variations** - Alternate spellings and forms
- **Pronunciation** - Phonetic guide (coming soon)

## Filtering & Search

### By Gender

Filter names by traditional gender association:

- **Male** - Names primarily given to boys
- **Female** - Names primarily given to girls
- **Neutral** - Gender-neutral names
- **All** - Show names from all categories

:::note

Gender classifications are based on historical usage data and may not reflect modern gender-neutral naming practices. Many names can be used for any gender.

:::

### By Country

Focus on specific naming traditions:

- Select one or multiple countries
- Compare popularity across regions
- Discover names from your heritage

### By Popularity

Find names by how common they are:

- **Top Ranked** - Most popular names (rank 1-100)
- **Trending** - Rising in popularity
- **Unique** - Rare and uncommon names
- **Classic** - Consistently popular over time

### By Starting Letter

Browse names alphabetically:

- Filter by one or multiple starting letters
- Great for finding names that sound good with your last name
- Discover names you might not have considered

### Advanced Filters

Combine multiple filters:

- Country + Gender + Starting Letter
- Popularity range + Year range
- Multiple countries for diverse options

## Data Sources

### Official Statistics

Name data comes from official government sources:

- **Social Security Administration** (US)
- **Office for National Statistics** (UK)
- **INSEE** (France)
- **INE** (Spain)
- **Destatis** (Germany)
- **ISTAT** (Italy)
- **IBGE** (Brazil)

### Data Quality

- **Verified Sources** - Only official government data
- **Regular Updates** - Annual data updates
- **Error Checked** - Validated for accuracy
- **Standardized** - Consistent formatting across countries

### Data Updates

The name database is updated annually:

- **New Years** - Latest data added each year
- **Corrections** - Historical data corrected as needed
- **App Updates** - New data releases with app updates

## Cultural Considerations

### Naming Traditions

Each country has unique naming patterns:

- **US/UK** - Mix of traditional, modern, and creative names
- **France** - Legal restrictions on acceptable names
- **Spain** - Often multiple middle names
- **Germany** - Gender must be clear from name
- **Italy** - Traditional family names
- **Brazil** - Portuguese and international influences

### Cultural Sensitivity

We respect cultural naming traditions:

- **Accurate Origins** - Correct cultural attribution
- **Pronunciation Guides** - Help with non-local names
- **Meaning Context** - Cultural significance where available
- **Avoid Appropriation** - Respect sacred or special names

## Name Characteristics

### Popularity Trends

Understand name popularity over time:

- **Rising Stars** - Names gaining popularity
- **Falling Favorites** - Names declining in use
- **Consistent Classics** - Steady popularity over decades
- **Vintage Revival** - Old names becoming popular again

### Name Lengths

Names vary by length:

- **Short** - 1-4 letters (e.g., Ava, Leo)
- **Medium** - 5-7 letters (e.g., Emma, Oliver)
- **Long** - 8+ letters (e.g., Isabella, Alexander)

### Style Categories

Names can be grouped by style:

- **Traditional** - Timeless classics (Elizabeth, William)
- **Modern** - Contemporary favorites (Harper, Mason)
- **Nature-Inspired** - From the natural world (Willow, River)
- **Virtue Names** - Positive qualities (Hope, Grace)
- **Place Names** - Geographic locations (Brooklyn, Austin)

## Adding Custom Names

### Personal Names

Add names that aren't in the database (coming soon):

- **Family Names** - Honor your heritage
- **Cultural Names** - Names from unsupported regions
- **Creative Names** - Unique combinations
- **Spelling Variations** - Personalized spellings

### Name Suggestions

Help us improve the database:

- **Report Missing Names** - Suggest additions
- **Correct Errors** - Fix inaccurate information
- **Add Meanings** - Contribute name meanings
- **Share Origins** - Help with cultural context

## Data Privacy

### No Personal Information

The name database contains:

- **Aggregate Data Only** - No personal information
- **Public Records** - From public government sources
- **Statistical Information** - Counts and rankings only

### Your Usage

Your name exploration is private:

- **Personal Preferences** - Your swipes are private
- **Match Data** - Only shared with your partner
- **No Profiling** - No third-party data sharing

## API Access

### Name Data Queries

For developers, name data is accessible via GraphQL:

```graphql
query GetNames($country: String!, $gender: String!) {
  names(country: $country, gender: $gender) {
    id
    name
    gender
    country
    year
    rank
  }
}
```

### Rate Limits

API queries are rate-limited:

- **Unauthenticated:** 100 queries per 15 minutes
- **Authenticated:** Higher limits for registered users

## Future Enhancements

Planned database improvements:

- [ ] More countries (Japan, India, Nigeria, etc.)
- [ ] Name meanings for all entries
- [ ] Pronunciation audio
- [ ] Name combination testing
- [ ] Sibling name suggestions
- [ ] Celebrity name influence tracking
- [ ] Historical popularity graphs

## Related Features

- **[Swiping](/docs/features/swiping)** - Explore the name database
- **[Collaboration](/docs/features/collaboration)** - Discuss names with your partner
- **[Configuration](/docs/configuration)** - Customize name sources

## Next Steps

- **[Start swiping](/docs/features/swiping)** - Explore the database
- **[Deploy your instance](/docs/deployment)** - Get started with Little Origin
- **[Configure filters](/docs/configuration)** - Customize your name exploration
