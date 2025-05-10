package com.example.GarbageMS.adapters

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.example.GarbageMS.fragments.NotificationSettingsFragment
import com.example.GarbageMS.fragments.NotificationsListFragment

class NotificationsViewPagerAdapter(fragmentActivity: FragmentActivity) : FragmentStateAdapter(fragmentActivity) {
    
    companion object {
        const val PAGE_NOTIFICATIONS = 0
        const val PAGE_SETTINGS = 1
        
        const val PAGES_COUNT = 2
    }
    
    private val fragmentsMap = mutableMapOf<Int, Fragment>()
    
    override fun getItemCount(): Int = PAGES_COUNT
    
    override fun createFragment(position: Int): Fragment {
        val fragment = when (position) {
            PAGE_NOTIFICATIONS -> NotificationsListFragment()
            PAGE_SETTINGS -> NotificationSettingsFragment()
            else -> throw IllegalArgumentException("Invalid position: $position")
        }
        
        fragmentsMap[position] = fragment
        return fragment
    }
    
    fun getFragment(position: Int): Fragment? = fragmentsMap[position]
} 