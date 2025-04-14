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
import com.example.GarbageMS.models.PickupLocationResponse

interface ApiService {
    @POST("/api/auth/login")
    suspend fun login(@Body loginRequest: LoginRequest): Response<LoginResponse>

    @POST("/api/auth/register")
    suspend fun register(@Body registrationRequest: RegistrationRequest): Response<Map<String, Any>>

    @POST("/api/auth/request-password-reset")
    suspend fun requestPasswordReset(@Body email: Map<String, String>): Response<Map<String, Any>>

    @POST("/api/auth/verify")
    suspend fun verifyToken(@Header("Authorization") token: String): Response<Boolean>

    @GET("/api/users/{userId}/profile")
    suspend fun getProfile(
        @Path("userId") userId: String,
        @Header("Authorization") authToken: String
    ): Response<ProfileResponse>

    @GET("/api/users/{userId}/profile/email")
    suspend fun getUserEmail(
        @Path("userId") userId: String,
        @Header("Authorization") authToken: String
    ): Response<EmailResponse>

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

    @PUT("/api/users/{userId}/profile/email")
    suspend fun updateUserEmail(
        @Path("userId") userId: String,
        @Header("Authorization") authToken: String,
        @Body emailRequest: EmailRequest
    ): Response<EmailResponse>

    @PUT("/api/users/{userId}/profile")
    suspend fun updateUserProfile(
        @Path("userId") userId: String,
        @Header("Authorization") authToken: String,
        @Body profileRequest: ProfileRequest
    ): Response<ProfileResponse>

    // Pickup Location endpoints
    @GET("api/pickup-locations")
    suspend fun getPickupLocations(): Response<PickupLocationResponse>
    
    @GET("api/pickup-locations/{id}")
    suspend fun getPickupLocationById(@Path("id") id: String): Response<PickupLocationResponse>

    companion object {
        private const val TAG = "ApiService"
        
        // For Android Emulator use 10.0.2.2 (special alias to your host loopback interface)
        // For real device testing on same WiFi network, use your computer's actual IP address
        // Change this to your backend server's address
        private const val BASE_URL = "http://10.0.2.2:8080/" // Android emulator localhost
        // private const val BASE_URL = "http://192.168.1.100:8080/" // Example for real device testing

        fun create(): ApiService {
            val loggingInterceptor = HttpLoggingInterceptor { message ->
                Log.d(TAG, message)
            }.apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(loggingInterceptor)
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