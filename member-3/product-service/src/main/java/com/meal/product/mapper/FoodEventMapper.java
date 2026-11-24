
package com.meal.product.mapper;

import com.meal.contract.event.CategoryEvent;
import com.meal.contract.event.ProductEvent;
import com.meal.product.entity.Category;
import com.meal.product.entity.Food;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Set;

@Mapper(componentModel = "spring")
public interface FoodEventMapper {

    CategoryEvent toCategoryEvent(Category category);

    Set<CategoryEvent> toCategoryEvents(Set<Category> categories);

    @Mapping(target = "eventType")
    ProductEvent toProductEvent(Food food, String eventType);
}
