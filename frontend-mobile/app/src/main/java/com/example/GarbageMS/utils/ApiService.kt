package com.example.GarbageMS.utils

import android.util.Log
import com.example.GarbageMS.models.*
import com.example.GarbageMS.utils.NetworkUtils.Companion.ChunkedTransferFixInterceptor
import com.google.gson.GsonBuilder
import okhttp3.ConnectionSpec
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

interface ApiService {
    @POST("/api/auth/login")
    suspend fun login(@Body loginRequest: LoginRequest): Response<LoginResponse>

    @POST("/api/auth/register")
    suspend fun register(@Body registrationRequest: RegistrationRequest): Response<Map<String, Any>>

    @GET("/api/auth/profile/{userId}")
    suspend fun getProfile(
        @Path("userId") userId: String,
        @Header("Authorization") authToken: String
    ): Response<UserProfile>

    @PUT("/api/auth/profile/{userId}")
    suspend fun updateProfile(
        @Path("userId") userId: String,
        @Header("Authorization") authToken: String,
        @Body profileUpdateRequest: ProfileUpdateRequest
    ): Response<Map<String, String>>

    @PUT("/api/auth/profile/{userId}/password")
    suspend fun updatePassword(
        @Path("userId") userId: String,
        @Header("Authorization") authToken: String,
        @Body passwordUpdateRequest: PasswordUpdateRequest
    ): Response<Map<String, String>>

    @GET("/api/auth/security-questions")
    suspend fun getSecurityQuestions(): Response<SecurityQuestionsResponse>

    @GET("users/{userId}/security-questions")
    suspend fun getUserSecurityQuestions(@Header("Authorization") token: String, @Path("userId") userId: String): Response<UserSecurityQuestionsResponse>

    @GET("api/users/profile/security-question")
    suspend fun getUserProfileSecurityQuestions(
        @Header("Authorization") token: String
    ): Response<UserSecurityQuestionsResponse>

    @GET("/api/auth/profile/security-questions")
    suspend fun getUserProfileSecurityQuestionsAlternative(
        @Header("Authorization") token: String
    ): Response<UserSecurityQuestionsResponse>

    companion object {
        private const val TAG = "ApiService"
        private const val BASE_URL = "http://10.0.2.2:8080/" // Android emulator localhost

        fun create(): ApiService {
            val loggingInterceptor = HttpLoggingInterceptor { message ->
                Log.d(TAG, message)
            }.apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(loggingInterceptor)
                // Add our custom interceptor to handle chunked transfer issues
                .addInterceptor(ChunkedTransferFixInterceptor())
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                // Add retry mechanism
                .retryOnConnectionFailure(true)
                // Ensure proper TLS is used
                .connectionSpecs(listOf(ConnectionSpec.MODERN_TLS, ConnectionSpec.COMPATIBLE_TLS, ConnectionSpec.CLEARTEXT))
                .build()

            val gson = GsonBuilder()
                .setLenient() // Be lenient with malformed JSON
                .create()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
                .create(ApiService::class.java)
        }
    }
} 