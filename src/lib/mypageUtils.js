export const formatProfileDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ko-KR');
};

export const getGenderLabel = (gender) => {
  if (!gender) return '-';
  const normalized = String(gender).toUpperCase();
  if (['M', 'MALE', '남성'].includes(normalized)) return '남성';
  if (['F', 'FEMALE', '여성'].includes(normalized)) return '여성';
  return gender;
};

export const normalizeGender = (gender) => {
  if (!gender) return 'none';
  const normalized = String(gender).toUpperCase();
  if (normalized === 'M' || normalized === 'MALE' || normalized === '남성') return 'male';
  if (normalized === 'F' || normalized === 'FEMALE' || normalized === '여성') return 'female';
  return 'none';
};

export const formatBirthdate = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('T')) {
    return value.split('T')[0];
  }
  return value;
};
