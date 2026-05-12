#!/usr/bin/env python3
"""Script to refactor word bank pagination and balancing."""

import collections
import json
import os
import re


def get_category(word, theme, patterns):
  """Categorizes a word based on the theme and patterns."""
  word_str = word["word"].lower()
  if theme == "I Before E":
    if "cei" in word_str:
      return "cei"
    elif "ie" in word_str:
      return "ie"
    elif "ei" in word_str:
      return "ei"
    else:
      return "default"
  elif patterns:
    for pat in patterns:
      if pat in word_str:
        return pat
    return "default"
  return "default"


def refactor_word_bank():
  """Refactors the word bank to balance pagination."""
  script_dir = os.path.dirname(os.path.abspath(__file__))
  file_path = os.path.join(script_dir, "src/data/wordBank.json")

  if not os.path.exists(file_path):
    print(f"Error: File not found at {file_path}")
    return

  with open(file_path, "r") as f:
    data = json.load(f)

  new_tiers = []
  for tier in data["tiers"]:
    new_tier = tier.copy()
    sections = tier.get("sections", [])

    # Group sections by base name (e.g., "Section 1" from "Section 1 (Part 1)")
    grouped_sections = collections.defaultdict(list)
    for sec in sections:
      name = sec["name"]
      match = re.match(r"^(.*?)(?:\s*\(Part \d+\))?$", name)
      base_name = match.group(1).strip() if match else name
      grouped_sections[base_name].append(sec)

    new_sections = []
    for sec_idx, (base_name, secs) in enumerate(grouped_sections.items()):
      all_words = []
      metadata = {}
      for sec in secs:
        all_words.extend(sec.get("words", []))
        if not metadata:
          metadata = {
              "theme": sec.get("theme"),
              "lessonScript": sec.get("lessonScript"),
              "imagePath": sec.get("imagePath"),
              "rule": sec.get("rule"),
          }

      # Deduplicate words based on 'word' field
      seen_words = set()
      unique_words = []
      for w in all_words:
        if w["word"] not in seen_words:
          seen_words.add(w["word"])
          unique_words.append(w)

      theme = metadata.get("theme")
      categorized_words = collections.defaultdict(list)
      patterns = []

      # Categorize
      if theme == "I Before E":
        for w in unique_words:
          cat = get_category(w, theme, patterns)
          categorized_words[cat].append(w)
      elif theme and ("/" in theme or " or " in theme):
        # Robust split logic to avoid IndexError and handle basic patterns
        if "/" in theme:
          parts = theme.split("/")
          if len(parts) >= 2:
            p1_list = parts[0].split()
            p2_list = parts[1].split()
            if p1_list and p2_list:
              patterns = [p1_list[-1].lower(), p2_list[0].lower()]
        elif " or " in theme:
          parts = theme.split(" or ")
          if len(parts) >= 2:
            p1_list = parts[0].split()
            p2_list = parts[1].split()
            if p1_list and p2_list:
              patterns = [p1_list[-1].lower(), p2_list[0].lower()]

        for w in unique_words:
          cat = get_category(w, theme, patterns)
          categorized_words[cat].append(w)
      else:
        categorized_words["default"] = unique_words

      # Distribute round-robin into bins of size 10
      cats = list(categorized_words.keys())
      cats = [c for c in cats if categorized_words[c]]

      bins = []
      current_bin = []
      cat_indices = {c: 0 for c in cats}

      if cats:
        while True:
          added_in_this_round = False
          for c in cats:
            idx = cat_indices[c]
            if idx < len(categorized_words[c]):
              current_bin.append(categorized_words[c][idx])
              cat_indices[c] += 1
              added_in_this_round = True
              if len(current_bin) == 10:
                bins.append(current_bin)
                current_bin = []
          if not added_in_this_round:
            break

      if current_bin:
        bins.append(current_bin)

      # Pad bins that have fewer than 10 words
      for b in bins:
        if len(b) < 10:
          while len(b) < 10:
            cat_counts = collections.defaultdict(int)
            for w in b:
              cat = get_category(w, theme, patterns)
              cat_counts[cat] += 1

            # Use filtered cats to avoid empty categories
            sorted_cats = sorted(cats, key=lambda c: cat_counts[c])

            # Try to find a word not already in the bin
            word_added = False
            for cat in sorted_cats:
              for w in categorized_words[cat]:
                if w not in b:
                  b.append(w)
                  word_added = True
                  break
              if word_added:
                break

            # If all words are already in the bin, we must repeat.
            # Pick from the least represented category that doesn't
            # cause immediate repetition.
            if not word_added:
              last_word = b[-1] if b else None
              for cat in sorted_cats:
                for w in categorized_words[cat]:
                  if w != last_word:
                    b.append(w)
                    word_added = True
                    break
                if word_added:
                  break

              if not word_added:
                # Fallback if all available words are the last word
                cat = sorted_cats[0]
                b.append(categorized_words[cat][0])
                word_added = True

      # Reconstruct JSON structure
      for bin_idx, b in enumerate(bins):
        part_name = (
            f"{theme} (Part {bin_idx+1})" if len(bins) > 1 else theme
        )
        part_id = (
            f"t{tier['id']}_s{sec_idx+1}_p{bin_idx+1}"
            if len(bins) > 1
            else f"t{tier['id']}_s{sec_idx+1}"
        )
        new_sec = {
            "name": part_name,
            "theme": theme,
            "words": b,
            "lessonScript": metadata.get("lessonScript"),
            "imagePath": metadata.get("imagePath"),
            "id": part_id,
            "rule": metadata.get("rule"),
        }
        new_sections.append(new_sec)

    new_tier["sections"] = new_sections
    new_tiers.append(new_tier)

  data["tiers"] = new_tiers
  with open(file_path, "w") as f:
    json.dump(data, f, indent=2)
  print(f"Successfully refactored {file_path}")


if __name__ == "__main__":
  refactor_word_bank()
