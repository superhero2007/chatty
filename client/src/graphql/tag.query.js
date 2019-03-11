import gql from 'graphql-tag';

// get the tag and all tag's categories
export const TAG_QUERY = gql`
  query tag {
    tag {
      id
      tag
      category {
        id
        category
      }
    }
  }
`;

export default TAG_QUERY;
