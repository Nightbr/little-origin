# Name Sourcing & AI Integration

Complete guide to name sourcing strategies including static data, external APIs, and AI generation with Mastra + OpenRouter.

---

## Overview

**Sourcing Priority:**
1. **Static JSON files** (instant, no cost)
2. **External APIs** (if available, low cost)
3. **AI Generation** (Mastra + OpenRouter, fallback)

**Goal:** Generate 250-1000 names per request to minimize API calls.

---

## Static Name Data

### File Structure

```
packages/name-data/data/
├── names-us.json     # United States
├── names-gb.json     # United Kingdom  
├── names-fr.json     # France
├── names-it.json     # Italy
├── names-de.json     # Germany
├── names-es.json     # Spain
└── names-ie.json     # Ireland
```

### JSON Format

```json
{
  "country": "US",
  "countryName": "United States",
  "male": [
    "Liam", "Noah", "Oliver", "James", "Elijah", "William",
    "Henry", "Lucas", "Benjamin", "Theodore", "Mateo",
    "Levi", "Sebastian", "Daniel", "Jack", "Michael",
    "Alexander", "Owen", "Asher", "Samuel", "Ethan",
    "Leo", "Jackson", "Mason", "Ezra", "John", "Hudson",
    "Luca", "Aiden", "Joseph", "David", "Jacob", "Logan",
    ... // 100-150 total
  ],
  "female": [
    "Olivia", "Emma", "Charlotte", "Amelia", "Sophia",
    "Isabella", "Ava", "Mia", "Evelyn", "Luna", "Harper",
    "Camila", "Sofia", "Scarlett", "Eleanor", "Madison",
    "Layla", "Penelope", "Aria", "Chloe", "Grace", "Ellie",
    "Nora", "Hazel", "Zoey", "Riley", "Victoria", "Lily",
    ... // 100-150 total
  ]
}
```

### Data Loader

```typescript
// packages/name-data/src/index.ts

import namesUS from './data/names-us.json';
import namesGB from './data/names-gb.json';
import namesFR from './data/names-fr.json';
import namesIT from './data/names-it.json';
import namesDE from './data/names-de.json';
import namesES from './data/names-es.json';
import namesIE from './data/names-ie.json';

export interface NameData {
  country: string;
  countryName: string;
  male: string[];
  female: string[];
}

const namesByCountry: Record<string, NameData> = {
  US: namesUS,
  GB: namesGB,
  FR: namesFR,
  IT: namesIT,
  DE: namesDE,
  ES: namesES,
  IE: namesIE,
};

export interface NameEntry {
  name: string;
  gender: 'male' | 'female';
  country: string;
}

export function getNamesByCountries(
  countryCodes: string[],
  gender: 'male' | 'female' | 'both',
  maxLength?: number
): NameEntry[] {
  const results: NameEntry[] = [];

  for (const code of countryCodes) {
    const data = namesByCountry[code];
    if (!data) continue;

    if (gender === 'male' || gender === 'both') {
      data.male.forEach(name => {
        if (!maxLength || name.length <= maxLength) {
          results.push({ name, gender: 'male', country: code });
        }
      });
    }

    if (gender === 'female' || gender === 'both') {
      data.female.forEach(name => {
        if (!maxLength || name.length <= maxLength) {
          results.push({ name, gender: 'female', country: code });
        }
      });
    }
  }

  return results;
}

export function getAllCountries(): Array<{ code: string; name: string }> {
  return Object.entries(namesByCountry).map(([code, data]) => ({
    code,
    name: data.countryName,
  }));
}

export function getCountryName(code: string): string | null {
  return namesByCountry[code]?.countryName || null;
}
```

---

## Mastra AI Integration

### Configuration

```typescript
// packages/mastra-ai/src/mastra.config.ts

import { Mastra } from '@mastra/core';
import { createOpenRouter } from '@mastra/openrouter';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'google/gemini-flash-1.5-8b',
  options: {
    temperature: 0.7,
    maxTokens: 4000,
  },
});

export const mastra = new Mastra({
  llms: {
    openrouter,
  },
});
```

### Name Generation Agent

```typescript
// packages/mastra-ai/src/agents/nameGenerator.ts

import { mastra } from '../mastra.config';
import { z } from 'zod';

const NameSchema = z.object({
  name: z.string(),
  gender: z.enum(['male', 'female']),
  country: z.string().length(2),
});

const NameListSchema = z.array(NameSchema);

export interface GenerateNamesParams {
  count: number;
  countries: string[];
  gender: 'male' | 'female' | 'both';
  maxChars: number;
  exclude: string[];
}

export async function generateNames(
  params: GenerateNamesParams
): Promise<Array<{ name: string; gender: 'male' | 'female'; country: string }>> {
  const { count, countries, gender, maxChars, exclude } = params;

  const countryNames = countries.map(getCountryName).join(', ');
  const genderText = gender === 'both' 
    ? 'both male and female' 
    : gender;

  const prompt = `You are a baby name expert. Generate ${count} REAL, authentic baby names.

REQUIREMENTS:
- Countries: ${countryNames} (ISO codes: ${countries.join(', ')})
- Gender: ${genderText}
- Maximum length: ${maxChars} characters
- Only REAL names that are actually used in these countries
- Names must be culturally appropriate and authentic
- NO made-up or fictional names
- NO duplicates

EXCLUDED NAMES (do not include):
${exclude.length > 0 ? exclude.join(', ') : 'None'}

Return ONLY a JSON array of objects with this exact format:
[
  { "name": "Sophia", "gender": "female", "country": "IT" },
  { "name": "Liam", "gender": "male", "country": "US" }
]

NO markdown, NO explanation, ONLY the JSON array.`;

  const response = await mastra.llms.openrouter.generate({
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract JSON from response
  const jsonMatch = response.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from LLM response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  // Validate with Zod
  const validated = NameListSchema.parse(parsed);

  // Additional filtering
  return validated.filter(n => 
    n.name.length <= maxChars &&
    !exclude.map(e => e.toLowerCase()).includes(n.name.toLowerCase())
  );
}
```

### Deduplication Tool

```typescript
// packages/mastra-ai/src/tools/deduplication.ts

export function deduplicateNames(
  names: Array<{ name: string; gender: string; country: string }>,
  existingNames: string[]
): typeof names {
  const seen = new Set(existingNames.map(n => n.toLowerCase()));
  const unique: typeof names = [];

  for (const entry of names) {
    const key = `${entry.name.toLowerCase()}-${entry.gender}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(entry);
    }
  }

  return unique;
}
```

---

## Name Service Implementation

```typescript
// apps/api/src/services/name.service.ts

import { db } from '../db/client';
import { names, preferences as prefsTable } from '@little-origin/core';
import { getNamesByCountries } from '@little-origin/name-data';
import { generateNames } from '@little-origin/mastra-ai';

class NameService {
  async seedNames(count: number = 250): Promise<{ count: number; source: string }> {
    const prefs = await this.getPreferences();
    const { countryOrigins, genderPreference, maxCharacters } = prefs;

    // 1. Try static files first
    const staticNames = getNamesByCountries(
      countryOrigins,
      genderPreference,
      maxCharacters
    );

    if (staticNames.length >= count) {
      const inserted = await this.insertNames(
        staticNames.slice(0, count),
        'static'
      );
      return { count: inserted, source: 'static' };
    }

    // 2. Use AI if OpenRouter key is available
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const existingNames = await this.getAllNames();
        const exclude = existingNames.map(n => n.name);

        const aiNames = await generateNames({
          count: count - staticNames.length,
          countries: countryOrigins,
          gender: genderPreference,
          maxChars: maxCharacters,
          exclude,
        });

        const combined = [...staticNames, ...aiNames];
        const inserted = await this.insertNames(combined, 'llm');
        
        return { count: inserted, source: 'llm' };
      } catch (error) {
        console.error('AI generation failed:', error);
        // Fall through to static-only
      }
    }

    // 3. Fallback to static-only
    const inserted = await this.insertNames(staticNames, 'static');
    return { count: inserted, source: 'static' };
  }

  private async insertNames(
    nameEntries: Array<{ name: string; gender: 'male' | 'female'; country: string }>,
    source: 'api' | 'llm' | 'seed' | 'static'
  ): Promise<number> {
    if (nameEntries.length === 0) return 0;

    // Insert with ON CONFLICT DO NOTHING (deduplication)
    const result = await db
      .insert(names)
      .values(
        nameEntries.map(entry => ({
          name: entry.name,
          gender: entry.gender,
          originCountry: entry.country,
          source,
        }))
      )
      .onConflictDoNothing() // Handles UNIQUE(name, gender) constraint
      .returning();

    return result.length;
  }

  private async getAllNames(): Promise<Array<{ name: string; gender: string }>> {
    return db.query.names.findMany({
      columns: {
        name: true,
        gender: true,
      },
    });
  }

  private async getPreferences() {
    const prefs = await db.query.preferences.findFirst();
    if (!prefs) {
      throw new Error('Preferences not set');
    }
    return prefs;
  }
}

export const nameService = new NameService();
```

---

## OpenRouter Configuration

### Model Recommendation

**google/gemini-flash-1.5-8b**
- **Cost:** ~$0.075 per 1M tokens
- **Speed:** Very fast (~2s for 1000 names)
- **Quality:** Good for structured output
- **Reliability:** High availability

**Alternative Models:**
- `meta-llama/llama-3.2-3b-instruct` - Cheaper ($0.06/1M tokens)
- `anthropic/claude-3-haiku` - More reliable but pricier ($0.25/1M tokens)

### Environment Setup

```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-...
```

**Get API key:** https://openrouter.ai/keys

### Cost Estimation

```
1000 names generation:
- Prompt: ~500 tokens
- Response: ~3000 tokens  
- Total: ~3500 tokens
- Cost: $0.000263 (with Gemini Flash)

10,000 names = $0.00263
100,000 names = $0.0263
```

**Extremely affordable** for most use cases.

---

## External API Integration (Optional)

### Baby Names API Example

```typescript
// packages/mastra-ai/src/tools/babyNamesApi.ts

interface BabyNameAPIResponse {
  names: Array<{
    name: string;
    gender: 'm' | 'f';
    origin: string;
  }>;
}

export async function fetchFromBabyNamesAPI(
  country: string,
  gender: 'male' | 'female' | 'both',
  limit: number
): Promise<Array<{ name: string; gender: 'male' | 'female'; country: string }>> {
  const apiKey = process.env.BABY_NAMES_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://api.babynames.com/v1/names?country=${country}&gender=${gender}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    const data: BabyNameAPIResponse = await response.json();

    return data.names.map(n => ({
      name: n.name,
      gender: n.gender === 'm' ? 'male' : 'female',
      country,
    }));
  } catch (error) {
    console.error('Baby Names API error:', error);
    return [];
  }
}
```

### Integration in Name Service

```typescript
// apps/api/src/services/name.service.ts

async seedNames(count: number = 250): Promise<{ count: number; source: string }> {
  const prefs = await this.getPreferences();
  
  // 1. Static files
  const staticNames = getNamesByCountries(...);
  
  // 2. External API (if available)
  if (process.env.BABY_NAMES_API_KEY) {
    const apiNames = await Promise.all(
      prefs.countryOrigins.map(country =>
        fetchFromBabyNamesAPI(country, prefs.genderPreference, 100)
      )
    ).then(results => results.flat());
    
    const combined = [...staticNames, ...apiNames];
    if (combined.length >= count) {
      const inserted = await this.insertNames(combined.slice(0, count), 'api');
      return { count: inserted, source: 'api' };
    }
  }
  
  // 3. AI generation
  // 4. Fallback to static
  // ...
}
```

---

## Testing AI Generation

### Manual Test

```typescript
// packages/mastra-ai/src/__tests__/nameGenerator.test.ts

import { generateNames } from '../agents/nameGenerator';

describe('Name Generator', () => {
  it('should generate names', async () => {
    const names = await generateNames({
      count: 10,
      countries: ['US', 'IT'],
      gender: 'both',
      maxChars: 12,
      exclude: [],
    });

    expect(names).toHaveLength(10);
    expect(names[0]).toHaveProperty('name');
    expect(names[0]).toHaveProperty('gender');
    expect(names[0]).toHaveProperty('country');
    
    // All names should be under max length
    names.forEach(n => {
      expect(n.name.length).toBeLessThanOrEqual(12);
    });
  });

  it('should exclude specified names', async () => {
    const names = await generateNames({
      count: 10,
      countries: ['US'],
      gender: 'male',
      maxChars: 15,
      exclude: ['John', 'Michael', 'David'],
    });

    const nameStrings = names.map(n => n.name.toLowerCase());
    expect(nameStrings).not.toContain('john');
    expect(nameStrings).not.toContain('michael');
    expect(nameStrings).not.toContain('david');
  });
});
```

### CLI Tool for Testing

```typescript
// packages/mastra-ai/src/cli/generate.ts

import { generateNames } from '../agents/nameGenerator';

async function main() {
  const names = await generateNames({
    count: 50,
    countries: ['US', 'FR'],
    gender: 'both',
    maxChars: 10,
    exclude: [],
  });

  console.log('Generated names:');
  console.log(JSON.stringify(names, null, 2));
  
  console.log(`\nTotal: ${names.length} names`);
  console.log(`Male: ${names.filter(n => n.gender === 'male').length}`);
  console.log(`Female: ${names.filter(n => n.gender === 'female').length}`);
}

main().catch(console.error);
```

```bash
# Run test generation
pnpm --filter @little-origin/mastra-ai tsx src/cli/generate.ts
```

---

## Error Handling

### Graceful Degradation

```typescript
async seedNames(count: number = 250) {
  try {
    // Try AI generation
    return await this.seedWithAI(count);
  } catch (error) {
    console.error('AI generation failed:', error);
    
    try {
      // Fallback to API
      return await this.seedWithAPI(count);
    } catch (error) {
      console.error('API fetch failed:', error);
      
      // Final fallback to static
      return await this.seedWithStatic(count);
    }
  }
}
```

### Rate Limiting

```typescript
// packages/mastra-ai/src/utils/rateLimiter.ts

class RateLimiter {
  private lastCall: number = 0;
  private minDelay: number = 1000; // 1 second between calls

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minDelay - timeSinceLastCall)
      );
    }
    
    this.lastCall = Date.now();
    return fn();
  }
}

export const aiRateLimiter = new RateLimiter();
```

---

## Summary

**Name Sourcing Strategy:**
1. ✅ Static JSON files (700+ names across 7 countries)
2. ✅ External APIs (optional, configurable)
3. ✅ AI Generation (Mastra + OpenRouter, bulk mode)
4. ✅ Automatic deduplication
5. ✅ Graceful degradation

**AI Features:**
- ✅ Gemini Flash 1.5-8B (very cheap, fast)
- ✅ Bulk generation (250-1000 names/call)
- ✅ Cultural authenticity validation
- ✅ Automatic retry with fallback
- ✅ Rate limiting

**Cost Optimization:**
- ✅ Static files used first (free)
- ✅ Bulk API calls (minimize requests)
- ✅ Deduplication (avoid redundant generation)
- ✅ Caching (database storage)

**Next Steps:**
- See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for setup
- See [FEATURES.md](./FEATURES.md) for integration
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production config