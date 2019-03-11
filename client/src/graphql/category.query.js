import gql from 'graphql-tag';

// get the category and all category's tags
export const CATEGORY_QUERY = gql`
  query category {
    category {
      id
      category
      tags {
        id
        tag
      }
    }
  }
`;

export default CATEGORY_QUERY;
