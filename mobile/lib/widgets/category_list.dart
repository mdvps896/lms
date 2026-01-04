import 'package:flutter/material.dart';
import '../utils/constants.dart';

class CategoryList extends StatefulWidget {
  final List<Map<String, dynamic>> categories;
  final Function(String)? onCategorySelected;
  
  const CategoryList({
    super.key, 
    required this.categories,
    this.onCategorySelected,
  });

  @override
  State<CategoryList> createState() => _CategoryListState();
}

class _CategoryListState extends State<CategoryList> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    // Add "All" category at the beginning
    final allCategories = [
      {'id': 'all', 'name': 'All'},
      ...widget.categories,
    ];

    return SizedBox(
      height: 40,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: allCategories.length,
        itemBuilder: (context, index) {
          final isSelected = index == _selectedIndex;
          final category = allCategories[index];
          final categoryName = category['name'] ?? 'Unknown';
          
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedIndex = index;
              });
              widget.onCategorySelected?.call(categoryName);
            },
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppConstants.primaryColor : Colors.white,
                borderRadius: BorderRadius.circular(25),
                border: Border.all(
                  color: isSelected ? AppConstants.primaryColor : Colors.grey.shade300,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: AppConstants.primaryColor.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        )
                      ]
                    : null,
              ),
              child: Center(
                child: Text(
                  categoryName,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppConstants.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
