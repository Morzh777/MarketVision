// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var raw$product_pb = require('./raw-product_pb.js');

function serialize_raw_product_BatchCreateProductsRequest(arg) {
  if (!(arg instanceof raw$product_pb.BatchCreateProductsRequest)) {
    throw new Error('Expected argument of type raw_product.BatchCreateProductsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_raw_product_BatchCreateProductsRequest(buffer_arg) {
  return raw$product_pb.BatchCreateProductsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_raw_product_BatchCreateProductsResponse(arg) {
  if (!(arg instanceof raw$product_pb.BatchCreateProductsResponse)) {
    throw new Error('Expected argument of type raw_product.BatchCreateProductsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_raw_product_BatchCreateProductsResponse(buffer_arg) {
  return raw$product_pb.BatchCreateProductsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_raw_product_GetCategoryConfigRequest(arg) {
  if (!(arg instanceof raw$product_pb.GetCategoryConfigRequest)) {
    throw new Error('Expected argument of type raw_product.GetCategoryConfigRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_raw_product_GetCategoryConfigRequest(buffer_arg) {
  return raw$product_pb.GetCategoryConfigRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_raw_product_GetCategoryConfigResponse(arg) {
  if (!(arg instanceof raw$product_pb.GetCategoryConfigResponse)) {
    throw new Error('Expected argument of type raw_product.GetCategoryConfigResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_raw_product_GetCategoryConfigResponse(buffer_arg) {
  return raw$product_pb.GetCategoryConfigResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_raw_product_GetQueriesForCategoryRequest(arg) {
  if (!(arg instanceof raw$product_pb.GetQueriesForCategoryRequest)) {
    throw new Error('Expected argument of type raw_product.GetQueriesForCategoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_raw_product_GetQueriesForCategoryRequest(buffer_arg) {
  return raw$product_pb.GetQueriesForCategoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_raw_product_GetQueriesForCategoryResponse(arg) {
  if (!(arg instanceof raw$product_pb.GetQueriesForCategoryResponse)) {
    throw new Error('Expected argument of type raw_product.GetQueriesForCategoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_raw_product_GetQueriesForCategoryResponse(buffer_arg) {
  return raw$product_pb.GetQueriesForCategoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_raw_product_GetRawProductsRequest(arg) {
  if (!(arg instanceof raw$product_pb.GetRawProductsRequest)) {
    throw new Error('Expected argument of type raw_product.GetRawProductsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_raw_product_GetRawProductsRequest(buffer_arg) {
  return raw$product_pb.GetRawProductsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_raw_product_GetRawProductsResponse(arg) {
  if (!(arg instanceof raw$product_pb.GetRawProductsResponse)) {
    throw new Error('Expected argument of type raw_product.GetRawProductsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_raw_product_GetRawProductsResponse(buffer_arg) {
  return raw$product_pb.GetRawProductsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var RawProductServiceService = exports.RawProductServiceService = {
  getRawProducts: {
    path: '/raw_product.RawProductService/GetRawProducts',
    requestStream: false,
    responseStream: false,
    requestType: raw$product_pb.GetRawProductsRequest,
    responseType: raw$product_pb.GetRawProductsResponse,
    requestSerialize: serialize_raw_product_GetRawProductsRequest,
    requestDeserialize: deserialize_raw_product_GetRawProductsRequest,
    responseSerialize: serialize_raw_product_GetRawProductsResponse,
    responseDeserialize: deserialize_raw_product_GetRawProductsResponse,
  },
  batchCreateProducts: {
    path: '/raw_product.RawProductService/BatchCreateProducts',
    requestStream: false,
    responseStream: false,
    requestType: raw$product_pb.BatchCreateProductsRequest,
    responseType: raw$product_pb.BatchCreateProductsResponse,
    requestSerialize: serialize_raw_product_BatchCreateProductsRequest,
    requestDeserialize: deserialize_raw_product_BatchCreateProductsRequest,
    responseSerialize: serialize_raw_product_BatchCreateProductsResponse,
    responseDeserialize: deserialize_raw_product_BatchCreateProductsResponse,
  },
  getCategoryConfig: {
    path: '/raw_product.RawProductService/GetCategoryConfig',
    requestStream: false,
    responseStream: false,
    requestType: raw$product_pb.GetCategoryConfigRequest,
    responseType: raw$product_pb.GetCategoryConfigResponse,
    requestSerialize: serialize_raw_product_GetCategoryConfigRequest,
    requestDeserialize: deserialize_raw_product_GetCategoryConfigRequest,
    responseSerialize: serialize_raw_product_GetCategoryConfigResponse,
    responseDeserialize: deserialize_raw_product_GetCategoryConfigResponse,
  },
  getQueriesForCategory: {
    path: '/raw_product.RawProductService/GetQueriesForCategory',
    requestStream: false,
    responseStream: false,
    requestType: raw$product_pb.GetQueriesForCategoryRequest,
    responseType: raw$product_pb.GetQueriesForCategoryResponse,
    requestSerialize: serialize_raw_product_GetQueriesForCategoryRequest,
    requestDeserialize: deserialize_raw_product_GetQueriesForCategoryRequest,
    responseSerialize: serialize_raw_product_GetQueriesForCategoryResponse,
    responseDeserialize: deserialize_raw_product_GetQueriesForCategoryResponse,
  },
};

exports.RawProductServiceClient = grpc.makeGenericClientConstructor(RawProductServiceService, 'RawProductService');
