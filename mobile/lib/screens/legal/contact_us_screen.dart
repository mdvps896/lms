import 'package:flutter/material.dart';

class ContactUsScreen extends StatelessWidget {
  const ContactUsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Contact Us',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            'Have questions? We are here to help!',
            style: TextStyle(fontSize: 16, height: 1.5),
          ),
          SizedBox(height: 20),
          ListTile(
            leading: Icon(Icons.email_outlined, color: Colors.blue),
            title: Text('Email Support'),
            subtitle: Text('support@khabri.com'),
          ),
          ListTile(
            leading: Icon(Icons.phone_outlined, color: Colors.green),
            title: Text('Call Support'),
            subtitle: Text('+91 9876543210'),
          ),
          ListTile(
            leading: Icon(Icons.location_on_outlined, color: Colors.red),
            title: Text('Office Address'),
            subtitle: Text('123, Education Hub, Knowledge City, India'),
          ),
        ],
      ),
    );
  }
}
