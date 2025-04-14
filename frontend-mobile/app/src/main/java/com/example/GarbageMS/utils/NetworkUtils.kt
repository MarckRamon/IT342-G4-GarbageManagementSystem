package com.example.GarbageMS.utils

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody
import okio.Buffer
import java.io.IOException

/**
 * This class contains utility functions related to network operations
 */
class NetworkUtils {
    companion object {
        private const val TAG = "NetworkUtils"
        
        /**
         * This interceptor handles chunked transfer encoding issues that might cause EOFExceptions
         */
        class ChunkedTransferFixInterceptor : Interceptor {
            @Throws(IOException::class)
            override fun intercept(chain: Interceptor.Chain): Response {
                val request = chain.request()
                val response: Response
                
                try {
                    response = chain.proceed(request)
                } catch (e: IOException) {
                    Log.e(TAG, "Error in network request", e)
                    throw e
                }
                
                // If the response body is chunked, we need special handling to avoid EOFExceptions
                if (response.header("Transfer-Encoding") == "chunked") {
                    try {
                        val originalBody = response.body
                        if (originalBody != null) {
                            val originalSource = originalBody.source()
                            val buffer = Buffer()
                            
                            // Read as much as we can safely
                            try {
                                originalSource.request(Long.MAX_VALUE)
                                buffer.writeAll(originalSource)
                            } catch (e: IOException) {
                                Log.e(TAG, "Error reading chunked response", e)
                                // Just return what we've got so far
                            }
                            
                            // Create a new response with a non-chunked body
                            val contentType = originalBody.contentType()
                            val contentLength = buffer.size
                            val body = ResponseBody.create(contentType, contentLength, buffer)
                            
                            return response.newBuilder()
                                .removeHeader("Transfer-Encoding")
                                .header("Content-Length", contentLength.toString())
                                .body(body)
                                .build()
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error handling chunked response", e)
                    }
                }
                
                return response
            }
        }
    }
} 