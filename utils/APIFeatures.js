/**
 * APIFeatures - Query builder for search, filter, sort, pagination
 * Usage: new APIFeatures(Model.find(), req.query).search().filter().sort().paginate()
 */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Full-text search
  search(fields = []) {
    if (this.queryString.keyword) {
      const keyword = this.queryString.keyword;
      
      if (fields.length > 0) {
        // Search in specific fields
        const searchConditions = fields.map((field) => ({
          [field]: { $regex: keyword, $options: 'i' },
        }));
        this.query = this.query.find({ $or: searchConditions });
      } else {
        // Use MongoDB text index
        this.query = this.query.find({
          $text: { $search: keyword },
        });
      }
    }
    return this;
  }

  // Filter by fields
  filter() {
    const queryObj = { ...this.queryString };

    // Exclude special query params
    const excludedFields = ['keyword', 'page', 'limit', 'sort', 'fields', 'populate'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Handle range filters (price[gte]=100&price[lte]=500)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|nin)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // Sort results
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // Select specific fields
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // Pagination
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = Math.min(parseInt(this.queryString.limit, 10) || 10, 100); // max 100 per page
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = APIFeatures;
