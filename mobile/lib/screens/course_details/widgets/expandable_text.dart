import 'package:flutter/material.dart';

class ExpandableText extends StatefulWidget {
  final String text;
  final int trimLines;

  const ExpandableText({
    super.key,
    required this.text,
    this.trimLines = 4,
  });

  @override
  State<ExpandableText> createState() => _ExpandableTextState();
}

class _ExpandableTextState extends State<ExpandableText> {
  bool _readMore = true;

  @override
  Widget build(BuildContext context) {
    const TextStyle textStyle = TextStyle(
      fontSize: 14,
      color: Colors.grey,
      height: 1.5,
    );
    
    final TextSpan span = TextSpan(text: widget.text, style: textStyle);
    final TextPainter tp = TextPainter(
      text: span,
      textDirection: TextDirection.ltr,
      maxLines: widget.trimLines,
    );
    
    return LayoutBuilder(
      builder: (context, constraints) {
        tp.layout(maxWidth: constraints.maxWidth);
        final bool isOverflowing = tp.didExceedMaxLines;

        if (!isOverflowing) {
          return Text(widget.text, style: textStyle);
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.text,
              style: textStyle,
              maxLines: _readMore ? widget.trimLines : null,
              overflow: _readMore ? TextOverflow.ellipsis : null,
            ),
            const SizedBox(height: 4),
            GestureDetector(
              onTap: () {
                setState(() {
                  _readMore = !_readMore;
                });
              },
              child: Text(
                _readMore ? 'Read More' : 'Read Less',
                style: const TextStyle(
                  color: Colors.blueAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
