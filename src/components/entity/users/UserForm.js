import { useState} from 'react';
import { StyleSheet} from 'react-native';
import useLoad from '../../API/useLoad.js';
import Icons from '../../UI/Icons.js';
import Form from '../../UI/Form.js';

const defaultUser ={
  UserCode: null,
  UserFirstname: '',
  UserLastname: '',
  UserEmail: "",
  UserLevel: null,
  UserYearID: null,        
  UserUsertypeID: null,    
  UserLeaderID: null,
  UserRegistered: 0,       
  UserPassword: '',        
  UserImageURL: 'null', 
};

const UserForm = ({originalUser,onSubmit, onCancel}) => {
  // Initialisations ---------------------
    defaultUser.UserID = Math.floor(100000 + Math.random() * 900000);
    defaultUser.UserImageURL = 'https://images.generated.photos/hQhusbkbyyxfX8kKXcneY4rroLsc8NkBbMVoGhDN4eg/rs:fit:256:256/czM6Ly9pY29uczgu/Z3Bob3Rvcy1wcm9k/LnBob3Rvcy92M18w/ODQyNzI2LmpwZw.jpg';

    const yearsEndpoint ='http://softwarehub.uk/unibase/api/years';
    const staffEndpoint ='http://softwarehub.uk/unibase/api/users/staff';
    const usertypesEndpoint ='http://softwarehub.uk/unibase/api/usertypes';
    const userEndpoint ='http://softwarehub.uk/unibase/api/users';

    const levels = [
        {value: 3, label: '3 (Foundation)'},
        {value: 4, label: '4 (First year)'},
        {value: 5, label: '5 (Second year)'},
        {value: 6, label: '6 (Final year)'},
        {value: 7, label: '7 (Masters)'},
    ];
    const registrationOptions = [
      { value: 0, label: 'Not Registered' },
      { value: 1, label: 'Registered' }
    ];
 


  // State -------------------------------
    const [user,setUser] = useState(originalUser || defaultUser);
    const [ years, ,isYearsLoading] = useLoad(yearsEndpoint);
    const [ leaders, ,isLeadersLoading] = useLoad(staffEndpoint);
    const [ UserType, ,isUserTypesLoading] = useLoad(usertypesEndpoint);
    const [users] = useLoad(userEndpoint);


  // Handlers ----------------------------
    const handleChange = (field,value) => setUser({...user, [field]: value });
    const handleSubmit = () => onSubmit(user);
  // View --------------------------------
  const submitLabel = originalUser ? 'Modify':'Add';
  const submitIcon = originalUser ? <Icons.Edit />:<Icons.Add />;

  const cohorts = years.map((year) => ({ value: year.YearID, label: `${year.YearID}`}));
  const User = users.map((user) => ({value: user.UserID, label: `${user.UserFirstname} ${user.UserLastname}`}));
  const userTypes = UserType.map((type) => ({value: type.UsertypeID, label: `${type.UsertypeID} ${type.UsertypeName}`}));
  return (
        <Form
            onSubmit={handleSubmit}
            onCancel={onCancel}
            submitLabel={submitLabel}
            submitIcon={submitIcon}
        >
            <Form.InputSelect
                label="User Type ID"
                prompt="Select type ID ..."
                options={userTypes}
                value={user.UserUsertypeID}
                onChange={(value) => handleChange('UserUsertypeID', value)}
                isLoading={isUserTypesLoading}
              />

            <Form.InputText 
                label="User first name"
                value={user.UserFirstname}
                onChange={(value) => handleChange('UserFirstname',value)}
                />

            <Form.InputText 
                label="User last name"
                value={user.UserLastname}
                onChange={(value) => handleChange('UserLastname',value)}
                /> 

            <Form.InputText 
                label="User email"
                value={user.UserEmail}
                onChange={(value) => handleChange('UserEmail',value)}
                />                               

            <Form.InputSelect 
                label="User level"
                prompt="Select user level ..."
                options={levels}
                value={user.UserLevel}
                onChange={(value) => handleChange('UserLevel',value)}
                />


            <Form.InputSelect 
                label="User Year ID"
                prompt="Select user year ID..."
                options={cohorts}
                value={user.UserYearID}
                onChange={(value) => handleChange('UserYearID',value)}
                isLoading={isYearsLoading}
                />     

              <Form.InputSelect
                label="User registered"
                prompt="Select registration status ..."
                options={registrationOptions}
                value={user.UserRegistered}
                onChange={(value) => handleChange('UserRegistered', value)}
              />                                           

              <Form.InputText
                label="User password"
                value={user.UserPassword}
                onChange={(value) => handleChange('UserPassword', value)}
              />

            <Form.InputText 
                label="User image URL"
                value={user.UserImageURL}
                onChange={(value) => handleChange('UserImageURL',value)}
                /> 

        </Form>
  );
};

const styles = StyleSheet.create({
});

export default UserForm;