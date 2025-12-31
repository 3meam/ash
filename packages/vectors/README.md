# ASH Test Vectors

**Ash was developed by 3maem Co. | شركة عمائم**

This package contains test vectors for validating ASH protocol implementations.

## Vector Files

| File | Description | Specification |
|------|-------------|---------------|
| `canonicalization.json.vectors.json` | JSON canonicalization test cases | DECISIONS.md Section 4 |
| `canonicalization.urlencoded.vectors.json` | URL-encoded canonicalization test cases | DECISIONS.md Section 5 |
| `binding.vectors.json` | Binding normalization test cases | DECISIONS.md Section 6 |
| `proof.vectors.json` | Proof generation test cases | DECISIONS.md Section 2 |

## Vector Format

Each vector file follows a consistent structure:

```json
{
  "name": "Vector Set Name",
  "version": "1.0.0",
  "description": "What these vectors test",
  "specification": "Reference to DECISIONS.md section",
  "rules": { ... },
  "vectors": [
    {
      "id": "unique-test-id",
      "description": "What this test verifies",
      "input": { ... },
      "expected": "expected output"
    }
  ],
  "notes": [ ... ]
}
```

## Usage

### Running Vector Tests

```typescript
import jsonVectors from './canonicalization.json.vectors.json';
import ash from '@anthropic/ash-core';

describe('JSON Canonicalization', () => {
  jsonVectors.vectors.forEach(vector => {
    it(vector.description, () => {
      const result = ash.canonicalize.json(vector.input);
      expect(result).toBe(vector.expected);
    });
  });
});
```

### Rejection Tests

Some vector files include `reject_vectors` for testing error cases:

```typescript
import jsonVectors from './canonicalization.json.vectors.json';
import ash from '@anthropic/ash-core';

describe('JSON Canonicalization - Rejections', () => {
  jsonVectors.reject_vectors?.forEach(vector => {
    it(vector.description, () => {
      // These should throw CanonicalizationError
      expect(() => ash.canonicalize.json(vector.input))
        .toThrow(ash.errors.CanonicalizationError);
    });
  });
});
```

## Vector Categories

### JSON Canonicalization (40+ vectors)

- Empty objects and arrays
- Key ordering (lexicographic, mixed case, special chars)
- Nested structures (up to 4 levels)
- All primitive types (string, number, boolean, null)
- String escaping (newline, tab, quotes, backslash)
- Unicode (emoji, Chinese, Arabic, mixed scripts)
- Real-world payloads (profile update, money transfer)
- Rejection cases (NaN, Infinity, undefined, BigInt, functions, symbols)

### URL-Encoded Canonicalization (40+ vectors)

- Basic key-value pairs
- Key ordering
- Duplicate keys (value order preserved)
- Percent encoding/decoding
- Space encoding (+ and %20)
- Unicode encoding
- Edge cases (empty values, missing equals, leading/trailing ampersands)
- Real-world forms (login, search, filters)

### Binding Normalization (25+ vectors)

- All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Path normalization (duplicate slashes, trailing slashes)
- Query string and fragment removal
- Method case normalization
- Invalid cases (missing leading slash, empty path/method)

### Proof Generation (5+ vectors)

- Basic proof without nonce
- Proof with server-issued nonce
- Empty payload
- Complex nested payload
- Different HTTP methods

## Extending Vectors

When adding new vectors:

1. Use a unique `id` for each vector
2. Include a clear `description`
3. Test edge cases thoroughly
4. Reference the relevant spec section
5. Run all tests to ensure no regressions

## Validation Requirements

All ASH implementations MUST:

1. Pass 100% of standard vectors
2. Correctly reject all rejection vectors
3. Produce identical output for identical input
4. Handle all Unicode correctly (NFC normalization)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-31 | Initial vector set |
