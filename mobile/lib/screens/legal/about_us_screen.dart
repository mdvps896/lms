import 'package:flutter/material.dart';

class AboutUsScreen extends StatelessWidget {
  const AboutUsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'About Us',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            'MD Consultancy is one of India’s fastest-growing and most trusted healthcare consultancy firms, dedicated to supporting medical professionals and healthcare institutions at both national and international levels. We provide expert guidance, training, and professional services to help healthcare aspirants build successful careers and navigate the complex process of licensing and placement in the UAE and other Gulf countries.',
            style: TextStyle(fontSize: 16, height: 1.5),
          ),
          SizedBox(height: 12),
          Text(
            'At MD Consultancy, our mission is to empower doctors, nurses, and allied health professionals with the knowledge, skills, and opportunities needed to thrive in competitive healthcare environments. We specialize in coaching and preparation for key licensing exams such as DHA (Dubai Health Authority), HAAD (Health Authority of Abu Dhabi), MOH (Ministry of Health UAE), Prometric tests, NCLEX, FPGEE, KAPS, PEBC, and USMLE. Our coaches and support team work closely with each candidate to offer personalized mentoring, exam strategies, and comprehensive study plans that increase the chances of success. Beyond exam support, we offer dataflow consulting services to streamline credential verification and documentation, making the licensing process smoother and more efficient. With years of experience and a commitment to excellence, MD Consultancy continues to be a reliable partner for healthcare professionals pursuing global opportunities.',
            style: TextStyle(fontSize: 16, height: 1.5),
          ),
        ],
      ),
    );
  }
}
