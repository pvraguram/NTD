package com.example.assistiveapp;

import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.example.assistiveapp.utils.ContactManager;
import java.util.ArrayList;
import java.util.List;

public class EmergencyContactsActivity extends AppCompatActivity {

    private ContactManager contactManager;
    private EditText etContact1, etContact2, etContact3;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_emergency_contacts);

        contactManager = new ContactManager(this);

        etContact1 = findViewById(R.id.etContact1);
        etContact2 = findViewById(R.id.etContact2);
        etContact3 = findViewById(R.id.etContact3);

        loadContacts();

        findViewById(R.id.btnSaveContacts).setOnClickListener(v -> saveContacts());
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
    }

    private void loadContacts() {
        List<String> contacts = contactManager.getContacts();
        if (!contacts.isEmpty()) etContact1.setText(contacts.get(0));
        if (contacts.size() > 1) etContact2.setText(contacts.get(1));
        if (contacts.size() > 2) etContact3.setText(contacts.get(2));
    }

    private void saveContacts() {
        List<String> contacts = new ArrayList<>();
        addIfNotEmpty(contacts, etContact1.getText().toString());
        addIfNotEmpty(contacts, etContact2.getText().toString());
        addIfNotEmpty(contacts, etContact3.getText().toString());

        contactManager.saveContacts(contacts);
        Toast.makeText(this, "Emergency contacts saved with priority!", Toast.LENGTH_SHORT).show();
        finish();
    }

    private void addIfNotEmpty(List<String> list, String value) {
        if (value != null && !value.trim().isEmpty()) {
            list.add(value.trim());
        }
    }
}
