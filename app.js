// Đối tượng `validator`
function validator(options) {

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    var selectorRules = {};

    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
        var errorMessage
        
        var rules = selectorRules[rule.selector]

        for (i = 0; i < rules.length; ++i) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default: 
                    errorMessage = rules[i](inputElement.value)
            }
            if (errorMessage) break
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = ''
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }

        return !errorMessage
    }

    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form)

    if (formElement) {
        // Khi submit
        formElement.onsubmit = function(e) {
            e.preventDefault();

            var isFormValid = true

            // Lặp qua từng rules và validate
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule)

                if (!isValid) {
                    isFormValid = false
                }
            })

            if (isFormValid) {
                // Trường hợp submit với Javascript  
                if (typeof options.onSubmit === 'function') {
                    var formInput = formElement.querySelectorAll('[name]')
                    var formValues = Array.from(formInput).reduce( (values, input) => {
                        
                        switch(input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                                break
                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = ''
                                    return values  
                                } 
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = []
                                }
                                values[input.name].push(input.value)
                                break;
                            case 'file':
                                values[input.name] = input.files
                                break
                            default:
                                values[input.name] = input.value
                        }

                        return values
                    }, {})
                    options.onSubmit(formValues);
                } 
                // Trường hợp submit với hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        }

        // Lặp qua mỗi rule và xử lý
        options.rules.forEach(rule => {
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test]
            }
            
            var inputElements = formElement.querySelectorAll(rule.selector)
            Array.from(inputElements).forEach((inputElement) => {
                // Xử lý trường hợp blur ra khỏi input
                inputElement.onblur = function() {
                    validate(inputElement, rule)
                }

                // Xử lý mỗi khi User nhập vào inputElement
                inputElement.oninput = function() {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                    errorElement.innerText = ''
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                }
            })
        });
    }
}

// Định nghĩa các rules
validator.isRequired = function(selector, message) {
    return {
        selector,
        test: function(value) {
            return value ? undefined : message || 'Vui lòng nhập trường này'
        }
    }
}

validator.isEmail = function(selector, message) {
    return {
        selector,
        test: function(value) {
            var regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
            return regex.test(value) ? undefined : message || 'Vui lòng nhập đúng email'
        }
    }
}

validator.minLength = function(selector, min, message) {
    return {
        selector,
        test: function(value) {
            return value.length >= min ? undefined : message || `Nhập tối thiểu ${min} ký tự`
        }
    }
}

validator.checkPass = function(selector, getConfirmValue, message) {
    return {
        selector,
        test: function(value) {
            return value === getConfirmValue() ? undefined : message || `Giá trị nhập vào không chính xác`
        }
    }
}