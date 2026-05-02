package com.example.assistiveapp.utils;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ContactManager {
    private static final String PREF_NAME = "EmergencyContacts";
    private static final String KEY_CONTACTS = "contacts_list";
    private SharedPreferences prefs;

    public ContactManager(Context context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public void saveContacts(List<String> contacts) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < contacts.size(); i++) {
            sb.append(contacts.get(i));
            if (i < contacts.size() - 1) sb.append(",");
        }
        prefs.edit().putString(KEY_CONTACTS, sb.toString()).apply();
    }

    public List<String> getContacts() {
        String saved = prefs.getString(KEY_CONTACTS, "");
        if (saved.isEmpty()) return new ArrayList<>();
        return new ArrayList<>(Arrays.asList(saved.split(",")));
    }

    public void addContact(String phoneNumber) {
        List<String> contacts = getContacts();
        if (!contacts.contains(phoneNumber)) {
            contacts.add(phoneNumber);
            saveContacts(contacts);
        }
    }
}
