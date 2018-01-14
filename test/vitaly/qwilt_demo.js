var container = document.getElementById("jsoneditor");

var json = {
  subitem: [
    {
      operation: {
        subitemManipulation: {
          minStepSizeForChunking: 1,
          maxSegmentSecViewTime: 1,
          requiredChunkSecViewTime: 1,
        },
      },
      elements: [
        {
          match: "kMatchOnlyOne",
          tokens: [
            {
              uriParam: "sq",
            },
            {
              pathSegment: {
                suffix: "sq",
                offsetFromSibling: 1,
              },
            },
            {
              pathSegment: {
                prefix: "Fragments",
              },
              extractionRule: {
                startExtractDelimiter: "=",
                endExtractDelimiter: ")",
                chopBytes: [],
              },
            },
          ],
          priority: 10,
          httpElementCount: [],
        },
      ],
      min_step_size: 7, // > 1
      max_segment_view_time: 7, // > 1
      string_container: {
        match: "kMatchAll", // enum: "kMatchAll","kMatchOnlyOne"
        string_token: {
          suffix: null, // string. either suffix or prefix must be filled
          prefix: null, // string
          start_delimeter: null, // string
          start_index: 0, // > 1
          end_delimeter: null, // string
          end_index: 0, // > 1
        },
      },
    },
  ],
  cache: {
    cacheControlKnobs: {
      useSMaxAge: "yes",
      maxStaleSec: 9,
    },

    serverResponseEchoRules: [], // unique object, custom insert
  },
  origin: {
    hosts: [],
    algorithm: "RR",
    config: [],
  },
};

function tokenTransformFullToPartialFunc(tokens) {
  return tokens.filter(token => "pathSegment" in token);
}

function tokenTransformPartialToFullFunc(currentTokens, newTokens) {
  if (currentTokens) {
    return currentTokens.filter(token => !("pathSegment" in token)).concat(newTokens);
  } else {
    return newTokens;
  }
}

const mappings = [
  // Subitem
  {
    from: "subitem[0].operation.subitemManipulation.minStepSizeForChunking",
    to: "subitem.minStepSizeForChunking",
    default: 1,
  },
  {
    from: "subitem[0].operation.subitemManipulation.maxSegmentSecViewTime",
    to: "subitem.maxSegmentSecViewTime",
    default: 7,
  },
  {
    from: "subitem[0].operation.subitemManipulation.requiredChunkSecViewTime",
    to: "subitem.requiredChunkSecViewTime",
    default: 3600,
  },
  {
    from: "subitem[0].elements[0].priority",
    to: "subitem.priority",
    default: 1,
  },
  {
    from: "subitem[0].elements[0].match",
    to: "subitem.match",
    default: "kMatchOnlyOne",
  },
  {
    from: "subitem[0].elements[0].tokens",
    to: "subitem.tokens",
    default: 1,
    transformFullToPartialFunc: tokenTransformFullToPartialFunc,
    transformPartialToFullFunc: tokenTransformPartialToFullFunc,
  },
  // Cache
  {
    from: "cache.cacheControlKnobs.useSMaxAge",
    to: "cache.useSMaxAge",
    default: null,
  },
  {
    from: "cache.serverResponseEchoRules",
    to: "cache.serverResponseEchoRules",
    default: [],
  },
  {
    from: "origin.hosts",
    to: "origin.hosts",
    default: [],
  },
];

const schema = {
  title: "Validation schema",
  type: "object",
  additionalProperties: false,
  properties: {
    subitem: {
      type: "object",
      properties: {
        minStepSizeForChunking: { type: "integer", minimum: 1 },
        maxSegmentSecViewTime: { oneOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
        requiredChunkSecViewTime: { type: "integer", minimum: 1 },
        priority: { type: "integer", minimum: 1 },
        match: { type: "string", enum: ["kMatchAll", "kMatchOnlyOne"] },
        tokens: { type: "array" },
      },
    },
    cache: {
      type: "object",
      properties: {
        useSMaxAge: {
          oneOf: [
            {
              type: "string",
              enum: ["yes", "no"],
            },
            { type: "null" },
          ],
        },
        serverResponseEchoRules: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,

            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["kStoreAndServe", "kDontStoreDontServe"] },
            },
          },
        },
      },
    },
    origin: {
      type: "object",
      properties: {
        hosts: {
          type: "array",
          items: {
            type: "number",
          },
        },
      },
    },
  },
};

function showFullMode() {
  if (editor.get()) {
    mappings.forEach(mapping => {
      let partialJson = editor.get();
      const newValue = _.get(partialJson, mapping.to, null);
      const currentValue = _.get(json, mapping.from, null);

      let transformedValue = newValue;
      if (mapping.transformPartialToFullFunc) {
        transformedValue = mapping.transformPartialToFullFunc(currentValue, newValue);
      }

      _.set(json, mapping.from, transformedValue);
    });
  }

  editor.setMode("code");
  editor.set(json);
  editor.setSchema(null);
}

function showPartialMode() {
  const friendlyJson = {};
  mappings.forEach(mapping => {
    const value = _.get(json, mapping.from, mapping.default);
    const transformedValue = mapping.transformFullToPartialFunc ? mapping.transformFullToPartialFunc(value) : value;
    _.set(friendlyJson, mapping.to, transformedValue);
  });

  editor.setMode("tree");
  editor.set(friendlyJson);
  editor.setSchema(schema);
}

document.getElementById("fullMode").onclick = function() {
  showFullMode();
};
document.getElementById("partialMode").onclick = function() {
  showPartialMode();
};

var editor = new JSONEditor(container);
editor.setMode("code");
editor.set(json);
showPartialMode()