---
sidebar_position: 4
---

# Name Database

Little Origin includes a database of baby names from multiple countries.

## Database Overview

### Name Information

Each name includes:

- **Name** - The baby name
- **Gender** - Male or Female
- **Country of Origin** - Country associated with the name
- **Source** - Data source identifier

## Filtering

### By Gender

Filter names by gender:

- **Male** - Male names
- **Female** - Female names
- **Both** - Show names from all categories

### By Country

Focus on specific naming traditions by selecting which countries' names to include.

### By Maximum Characters

Set a maximum name length to filter results.

## Technical Details

### Name Data Structure

```graphql
query GetNames {
  nextNames(limit: 10) {
    id
    name
    gender
    originCountry
    source
  }
}
```

### Data Sources

Names are loaded from static JSON files included with the application. Additional names can be ingested through the app's name ingestion feature.

### Ingesting New Names

The app supports ingesting name data from external sources. See the onboarding process or app settings for ingestion options.

## Related Features

- **[Swiping](/docs/features/swiping)** - Explore the name database
- **[Configuration](/docs/configuration)** - Customize name sources

## Next Steps

- **[Start swiping](/docs/features/swiping)** - Explore the database
- **[Deploy your instance](/docs/deployment)** - Get started with Little Origin
- **[Configure filters](/docs/configuration)** - Customize your name exploration
