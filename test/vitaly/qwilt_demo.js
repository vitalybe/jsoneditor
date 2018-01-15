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
  origins: {
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

function isNull(value) {
  return value === null;
}

const mappings = [
  // Subitem
  {
    from: "subitem[0].operation.subitemManipulation.minStepSizeForChunking",
    to: "subitem.minStepSizeForChunking",
    default: 1,
    schema: { type: "integer", minimum: 1 },
  },
  {
    from: "subitem[0].operation.subitemManipulation.maxSegmentSecViewTime",
    to: "subitem.maxSegmentSecViewTime",
    default: 7,
    discardIf: isNull,
    schema: { oneOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
  },
  {
    from: "subitem[0].operation.subitemManipulation.requiredChunkSecViewTime",
    to: "subitem.requiredChunkSecViewTime",
    default: 3600,
    schema: { type: "integer", minimum: 1 },
  },
  {
    from: "subitem[0].elements[0].priority",
    to: "subitem.priority",
    default: 1,
    schema: { type: "integer", minimum: 1 },
  },
  {
    from: "subitem[0].elements[0].match",
    to: "subitem.match",
    default: "kMatchOnlyOne",
    schema: { type: "string", enum: ["kMatchAll", "kMatchOnlyOne"] },
  },
  {
    from: "subitem[0].elements[0].tokens",
    to: "subitem.tokens",
    default: 1,
    transformFullToPartialFunc: tokenTransformFullToPartialFunc,
    transformPartialToFullFunc: tokenTransformPartialToFullFunc,
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pathSegment: {
            type: "object",
            properties: {
              prefix: { type: ["string", "null"] },
              suffix: { type: ["string", "null"] },
            },
          },
          extractionRule: {
            type: "object",
            properties: {
              startExtractDelimiter: { type: "string" },
              startExtractDelimiterIndex: { type: "integer", minimum: 0 },
              endExtractDelimiter: { type: "string" },
              endExtractDelimiterIndex: { type: "integer", minimum: 0 },
            },
          },
        },
      },
    },
  },
  // Cache
  {
    from: "serverResponseEchoRules",
    to: "cache.serverResponseEchoRules",
    default: [],
    schema: {
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
  {
    from: "shouldStoreOrigServerResponseHeadersInMeta",
    to: "cache.shouldStoreOrigServerResponseHeadersInMeta",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "shouldServeOrigServerResponseHeadersFromMetaToLocal ",
    to: "cache.shouldServeOrigServerResponseHeadersFromMetaToLocal ",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "shouldStoreLastModifiedPerSubietm",
    to: "cache.shouldStoreLastModifiedPerSubietm",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "shouldStoreEtagPerSubietm",
    to: "cache.shouldStoreEtagPerSubietm",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "deleteContentOn404",
    to: "cache.deleteContentOn404",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.useSMaxAge",
    to: "cache.useSMaxAge",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.useMaxAge",
    to: "cache.cacheControlKnobs.useMaxAge",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.useNoStore",
    to: "cache.cacheControlKnobs.useNoStore",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.useNoCache",
    to: "cache.cacheControlKnobs.useNoCache",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.useNoTransform",
    to: "cache.cacheControlKnobs.useNoTransform",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.useProxyRevalidate",
    to: "cache.cacheControlKnobs.useProxyRevalidate",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.usePrivate",
    to: "cache.cacheControlKnobs.usePrivate",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.useMustRevalidate",
    to: "cache.cacheControlKnobs.useMustRevalidate",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.usePublic",
    to: "cache.cacheControlKnobs.usePublic",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.useExpires",
    to: "cache.cacheControlKnobs.useExpires",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.invalidateByLastModified",
    to: "cache.cacheControlKnobs.invalidateByLastModified",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.invalidateByEtag",
    to: "cache.cacheControlKnobs.invalidateByEtag",
    schema: { oneOf: [{ type: "string", enum: ["yes", "no"] }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.fallbackMinExpirySec",
    to: "cache.cacheControlKnobs.fallbackMinExpirySec",
    schema: { oneOf: [{ type: "integer" }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.maxStaleSec",
    to: "cache.cacheControlKnobs.maxStaleSec",
    schema: { oneOf: [{ type: "integer" }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.minExpirySec",
    to: "cache.cacheControlKnobs.minExpirySec",
    schema: { oneOf: [{ type: "integer" }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  {
    from: "cacheControlKnobs.minFreshSec",
    to: "cache.cacheControlKnobs.minFreshSec",
    schema: { oneOf: [{ type: "integer" }, { type: "null" }] },
    default: null,
    discardIf: isNull,
  },
  // Multi origin
  {
    from: "origins.hosts",
    to: "origins.hosts",
    default: [],
    schema: {
      type: "array",
      items: {
        type: "string",
        pattern: "^\\S+\\.\\S+",
      },
    },
  },
  {
    from: "origins.algorithm",
    to: "origins.algorithm",
    default: "RR",
    schema: {
      type: "string",
      enum: ["RR", "WRR", "HASH"],
    },
  },
  {
    from: "origins.config",
    to: "origins.config",
    default: [],
    schema: {
      type: "array",
      items: {
        type: "integer",
      },
    },
  },
];

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

      if(mapping.discardIf && mapping.discardIf(transformedValue)) {
        _.unset(json, mapping.from);
      } else {
        _.set(json, mapping.from, transformedValue);
      }
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

function createSchemaFromMappings(mappings) {
  const schema = {
    title: "Validation schema",
    type: "object",
    additionalProperties: false,
    properties: {
      subitem: {
        type: "object",
        properties: {},
      },
      cache: {
        type: "object",
        properties: {},
      },
      origins: {
        type: "object",
        properties: {},
      },
    },
  };

  mappings.forEach(mapping => {
    var [section, ...parts] = mapping.to.split(".");
    if (!(section in schema.properties)) {
      throw new Error("invalid section: " + section);
    }

    var currentProperties = schema.properties[section];
    for (var i = 0; i < parts.length - 1; i++) {
      currentProperties["properties"][parts[i]] = { type: "object", properties: {} };
      currentProperties = currentProperties["properties"][parts[i]];
    }

    currentProperties.properties[parts[parts.length - 1]] = mapping.schema;
  });

  return schema;
}

document.getElementById("fullMode").onclick = function() {
  showFullMode();
};
document.getElementById("partialMode").onclick = function() {
  showPartialMode();
};

var schema = createSchemaFromMappings(mappings);
var editor = new JSONEditor(container, {history: false});
editor.setMode("code");
editor.set(json);
showPartialMode();
