export default interface DocAttributes {
  title: string;
  slug: string;
  description?: string;
  category: 'developers' | 'users' | 'agents';
  order?: number;
}
