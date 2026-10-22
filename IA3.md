# Big Data (BDTT): IA3

**Faculty:** Dr. Grace Mary Kanaga E.
**Type:** Project (assignment in GCR, posted Oct 20, edited Oct 20)
**Marks:** 30 points
**Due:** Oct 25 (2026). Upload to GCR on or before 25-10-26.
**Source:** GCR assignment "Project" (pasted by Lebi).

> The decided project plan is in `PLAN.md` (same folder). Start there in a new session.
> **Title:** ThreadSense: Discovering Which Reddit Communities You Belong In. **Dataset:** Reddit (Kaggle), schema to be confirmed.

## What IA3 is

IA3 is evaluated on the development of the assigned project. Review happens during the III IA, with a live demo. Bring the laptop.

## To do

1. Develop the project assigned to you. The assignment sheet is here: https://docs.google.com/spreadsheets/d/1csqoVLrCfscBXFYnW0wmF9clx0baP4mVJPVUVP77dyc/edit?usp=sharing (find Lebi's row; not read yet).
2. Prepare a report with proper explanations. It must cover:
   - Problem statement
   - Dataset description
   - Methodology
   - Tools used
   - MapReduce code
   - Results
   - Visualizations
   - Conclusions
   - Evidence of execution of the complete workflow
3. Prepare a 7 to 10 page PPT.
4. Upload the report and PPT to GCR on or before 25-10-26.
5. Present the findings and demo the workflow live at the III IA.

## Objective

Hands-on big data work:

- Ingest a large Kaggle dataset into MongoDB.
- Preprocess and clean the data.
- Apply MapReduce in MongoDB for the analysis.
- Present insights, trends or patterns found.

## Project guidelines

- Dataset from Kaggle, minimum 50,000 records recommended.
- The dataset must be unstructured or semi-structured (reviews, logs, news, tweets, product data, images with metadata).
- Put the Kaggle dataset link in the final report.
- MongoDB for storage and querying.
- MapReduce framework for large-scale processing.

## Deliverables

| Item | Format | Where |
|---|---|---|
| Report | Doc/PDF | GCR |
| PPT | 7-10 pages | GCR |
| Working demo | Laptop | III IA review |

## Unknowns

- Whether the assigned project in the sheet fixes the dataset or only the topic.
- Team size.
- Exact review date.
- Rubric split of the 30 marks (not given).
- MongoDB `mapReduce` is deprecated since 5.0 in favour of aggregation pipelines. Check which version the lab runs and whether the faculty expects `db.collection.mapReduce()` specifically.

## Checklist

- [ ] Open the assignment sheet and find the assigned project
- [x] Title and dataset family chosen (ThreadSense, Reddit)
- [ ] Confirm exact Kaggle dataset and schema, note the link
- [ ] Run MongoDB (Docker) and ingest the data
- [ ] Clean and preprocess
- [ ] Write the MapReduce jobs and capture their output
- [ ] Make visualizations
- [ ] Write the report
- [ ] Make the 7-10 page PPT
- [ ] Upload to GCR by 25-10-26
- [ ] Rehearse the demo on the laptop
