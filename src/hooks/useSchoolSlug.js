import { useParams } from 'react-router-dom';
import { getSubdomain } from '@/utils/subdomain';

export const useSchoolSlug = () => {
  const { schoolSlug, schoolAlias, domain } = useParams();
  const subdomain = getSubdomain();
  
  // Priority: 
  // 1. URL Param (for path-based routing like /school1/login)
  // 2. Subdomain (for domain-based routing like school1.domain.com/login)
  return schoolSlug || schoolAlias || domain || subdomain;
};
